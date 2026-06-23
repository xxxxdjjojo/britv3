# Current Listing Data Flow

> **Date:** 2026-06-19
> **Gate:** A (discovery).
> **Purpose:** trace the *existing* listing lifecycle end-to-end (file + function), so
> the partner-ingestion pipeline reuses these paths instead of forking them. Every step
> cites a real file/function read in this worktree.

Cross-refs: [`PARTNER_INGESTION_CODEBASE_AUDIT.md`](./PARTNER_INGESTION_CODEBASE_AUDIT.md),
[`AGENCY_AND_LISTING_DATA_DICTIONARY.md`](./AGENCY_AND_LISTING_DATA_DICTIONARY.md),
[`LISTING_SOURCE_OF_TRUTH_POLICY.md`](./LISTING_SOURCE_OF_TRUTH_POLICY.md).

---

## 0. Entity model (one paragraph)

`properties` is the **physical asset** (global, `properties_select USING (TRUE)`).
`listings` is the **marketing offering** (scoped by `user_id = auth.uid()`), FK
`property_id → properties(id) ON DELETE CASCADE`. `property_media` hangs off
`listings(id)`. The public search reads a **materialized view** `search_listings`
that only includes `WHERE l.status='active' AND l.deleted_at IS NULL`. All four are in
`supabase/migrations/003001_property_portal.sql`.

---

## 1. Create a listing (manual, first-party)

`createListing(supabase, userId, input)` — `src/services/listings/listing-service.ts:103`

1. Validate: rent listing requires `rent_frequency` (`:109`).
2. **Geocode** the postcode → `geocodePostcode(input.postcode)` (`src/services/geocoding/postcodes-io.ts`).
3. `splitFields()` partitions input into `PROPERTY_FIELDS` vs `LISTING_FIELDS` (`:79`).
4. Insert `properties` row (`:120`).
5. **Set PostGIS coordinates** via RPC `set_property_coordinates(p_property_id,p_lng,p_lat)` — fire-and-forget (`:134`).
6. Insert `listings` row with **`status:'draft'` forced** (`:146`) — the create path can never go live directly.
7. **Refresh the MV** `refresh_search_listings()` — fire-and-forget (`:162`).

> **Trigger side-effects on insert** (`003001_property_portal.sql`): `trg_update_properties_tsv`
> builds `description_tsv`; `trg_generate_listing_slug` builds the unique `slug`.

## 2. Upload media

`uploadPropertyImage(supabase, userId, …)` — `src/services/listings/media-service.ts:72`

1. Verify listing ownership (`from("listings")`, `:22`).
2. Validate file (`validateImageFile`), process/resize (`processPropertyImage`).
3. Upload original + thumbnail to **`property-images`** Storage bucket (`:109`, `:122`).
4. Insert `property_media` row (`media_type:'image'`, `url`, `thumbnail_url`, `sort_order`, `uploaded_by`) (`:144`).

Floor plans / EPC docs → `uploadFloorPlan()` (`:174`) use the **`property-documents`** bucket.

## 3. Publish (draft → active)

`updateListing(supabase, userId, listingId, { status:'active', … })` — `:177`

1. Verify ownership (`select("*, properties(*)").eq("user_id", userId)`, `:184`).
2. **Publish guard** (`:200`): going `active` requires `planning_permission_status`
   (from the update or the existing property) else throws
   `"planning_permission_status is required to publish a listing"`.
3. Update property and/or listing fields (`:216`, `:231`).
4. **Refresh MV** (`:246`) → the listing now appears in `search_listings` because
   `status='active'`.

## 4. Edit (non-status)

Same `updateListing` path; `splitFields` routes changes to `properties` or `listings`.
**Price change** on `listings` fires `trg_track_price_changes` →
inserts a `price_history` row with `auth.uid()` as `changed_by`
(`003001_property_portal.sql:201`, SECURITY DEFINER).

## 5. Status change (under_offer / sold / let / withdrawn)

`updateListing` with the new `listing_status` enum value
(`draft|active|under_offer|sold|let|withdrawn|archived`). Anything other than `active`
drops the row out of `search_listings` on the next MV refresh (the MV filters
`status='active'`).

## 6. Remove (soft delete)

`deleteListing(supabase, userId, listingId)` — `:349`. Sets `deleted_at = now()`
(**never a hard DELETE**), then refreshes the MV. Matches the non-negotiable
"archive, never destructive delete". (Note: `agent-feed-service.deleteFeedIntegration`
*is* a hard delete, but that removes an *integration record*, not a listing.)

## 7. Link to an agent

A listing is "owned" by the agent through `listings.user_id = agent auth.uid()`. The
agent dashboard reads via `get_agent_dashboard_kpis(p_agent_id)`
(`20260313_agent_dashboard.sql:549`) which counts
`listings WHERE user_id = p_agent_id AND status='active'`. There is **no
branch/organisation link on a listing today** — only `user_id`. Branch association for
imported listings is held in `feed_branch_links` / `feed_listing_links`
(`20260619120003_agent_feed_import_ledger.sql`), not on the listing row itself.

## 8. Search display

`search_listings_by_radius(...)` and `search_listings_by_polygon(...)`
(`003001_property_portal.sql:338`, `:416`) read the `search_listings` MV and apply
filters (listing_type, price, bedrooms, property_type) + a UUID cursor. Both are
`STABLE plpgsql`. Called from listing search services (the MV is the only public read
surface — RLS on `listings` exposes only `status='active'` rows anyway via
`listings_select_active`).

## 9. Map marker

The MV carries `p.coordinates GEOGRAPHY(POINT,4326)` and `idx_search_listings_coordinates`
(GIST). A marker exists **only if** `set_property_coordinates` ran during create.
`ST_Distance` / `ST_DWithin` (radius) and `ST_Within` (polygon) drive map results.

---

## 10. How the **import** path diverges today (the gap)

`publishApprovedImportItem()` (`src/services/agent/agent-feed-import-service.ts:474`)
**inserts `properties` + `listings` + `property_media` directly** — it does **not** call
`createListing`/`uploadPropertyImage`. Consequences (all confirmed by reading the code):

| First-party path does | Import path does | Effect |
|---|---|---|
| geocode + `set_property_coordinates` | nothing | **No coordinates → no map marker** |
| `refresh_search_listings()` after write | nothing | Even if active, not in search until next refresh |
| `status:'draft'` then explicit publish guard | inserts `status:'draft'` and stops | **Never searchable** (MV is `status='active'`) |
| (n/a) | inserts a fresh property+listing each run | **Duplicates on re-publish** (no upsert against `feed_listing_links.external_listing_id`) |

**Design implication:** the connector pipeline should publish *through*
`createListing` + `uploadPropertyImage` (or a thin wrapper) so it inherits geocoding,
MV refresh, slug/tsv triggers, and the publish guard — then flip `status` to `active`
under the source-of-truth policy. See
[`LISTING_SOURCE_OF_TRUTH_POLICY.md`](./LISTING_SOURCE_OF_TRUTH_POLICY.md) and the
Known-gaps section of [`PARTNER_INGESTION_GATE_A_REPORT.md`](./PARTNER_INGESTION_GATE_A_REPORT.md).
