# Canonical Listing Contract

> **Date:** 2026-06-19
> **Gate:** A (design proposal).
> **Purpose:** define the canonical listing shape every connector normalizes to, plus a
> **field-provenance model** so TrueDeed knows which fields came from the feed vs were
> edited in-app — the prerequisite for the source-of-truth policy.

Cross-refs: [`AGENCY_AND_LISTING_DATA_DICTIONARY.md`](./AGENCY_AND_LISTING_DATA_DICTIONARY.md),
[`LISTING_SOURCE_OF_TRUTH_POLICY.md`](./LISTING_SOURCE_OF_TRUTH_POLICY.md),
[`PARTNER_CONNECTOR_ARCHITECTURE.md`](./PARTNER_CONNECTOR_ARCHITECTURE.md).

---

## 1. The canonical shape (today)

The canonical shape already exists as `NormalizedFeedListing` in
`src/services/agent/agent-feed-import-service.ts:45`. Verbatim fields:

`source`, `external_id`, `external_branch_id`, `status` (`available|withdrawn`),
`listing_type`, `price`, `rent_frequency`, `address_line1`, `address_line2`, `city`,
`postcode`, `property_type`, `bedrooms`, `bathrooms`, `reception_rooms`,
`square_footage`, `title`, `description`, `features`, `tenure`,
`planning_permission_status`, `media[] {external_id,url,caption,sort_order}`,
`raw_payload`.

This maps cleanly onto `properties` + `listings` + `property_media` (see data
dictionary). **Gap:** `source` is currently the literal `"reapit"` — generalise to a
`SourceProvenance` (below) and widen the type when CSV/sandbox connectors land.

## 2. Field → canonical-table mapping

| Canonical field | Table.column | Notes |
|---|---|---|
| address_line1/2, city, postcode | `properties.*` | postcode must satisfy `valid_postcode` regex |
| property_type | `properties.property_type` | must be a `property_type` enum value |
| bedrooms, bathrooms, reception_rooms, square_footage | `properties.*` | bathrooms NUMERIC(3,1) |
| title, description, features | `properties.*` | title ≤200, description ≤5000 |
| tenure | `properties.tenure` | `tenure_type` enum |
| planning_permission_status | `properties.planning_permission_status` | **publish guard** (listing-service) |
| listing_type, price, rent_frequency | `listings.*` | rent requires rent_frequency |
| status | `listings.status` | feed `available`→`draft` then policy-gated `active`; `withdrawn`→tombstone |
| media[] | `property_media.*` | `media_type='image'` default; URL needs SSRF allowlist |
| (coordinates) | `properties.coordinates` | **derive via geocode** — feed rarely supplies lat/lng |

## 3. Provenance model (proposed)

Add provenance so edits and re-imports can be reconciled without clobbering human work.

```ts
// proposed
export type FieldOrigin = "feed" | "truedeed_edit" | "derived";

export type SourceProvenance = Readonly<{
  provider: string;          // 'reapit' | 'csv' | 'sandbox' | ...
  integration_id: string;
  external_id: string;
  external_branch_id: string | null;
  imported_at: string;       // ISO
  payload_sha256: string;    // ties back to feed_import_items
}>;

// per-field origin map, stored alongside the canonical row
export type FieldProvenanceMap = Record<string, FieldOrigin>;
```

### Storage options (product-decision)

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **A. Reuse existing tables** | `properties.features` JSONB holds `_provenance`; the link tables (`feed_listing_links`, `feed_media_links`) hold the source identity | zero migration; uses what Codex built | provenance buried in `features`; awkward queries |
| **B. New columns** | `properties.source TEXT`, `listings.source_external_id TEXT`, `listings.field_provenance JSONB` | first-class, queryable | migration needed; new RLS considerations |
| **C. Separate provenance table** | `listing_provenance(listing_id, field, origin, source_external_id, updated_at)` | full per-field history | most complex; join cost |

**Recommendation:** **B** for source identity (so search/admin can filter "feed-sourced")
+ a `field_provenance JSONB` for the per-field origin map. The link tables already carry
`external_listing_id`/`external_media_id`, so source identity is partly there; promote it
to first-class columns for queryability.

## 4. Invariants the contract must hold

1. `status` from a feed never publishes directly as `active` — it lands `draft`, then the
   3-action **Publish** step (policy-gated) sets `active` (matches `createListing`
   forcing `draft` and the publish guard).
2. Every published listing carries a `SourceProvenance` tying it to a
   `feed_import_items.id` (via `canonical_listing_id` already on that table).
3. `withdrawn` feed status → **archive** (`listing_status='archived'` or `withdrawn`),
   never destructive delete (matches `deleteListing` soft-delete pattern).
4. A field marked `truedeed_edit` in `field_provenance` is protected from feed overwrite
   per [`LISTING_SOURCE_OF_TRUTH_POLICY.md`](./LISTING_SOURCE_OF_TRUTH_POLICY.md).
5. Material-information (NTSELAT Part A) fields must be present before publish
   (`validateNormalizedListing` already enforces tenure, price, planning, address).
