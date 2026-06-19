# Listing Source-of-Truth Policy

> **Date:** 2026-06-19
> **Gate:** A (policy proposal).
> **Purpose:** define, for every feed-vs-TrueDeed conflict, who wins and what happens —
> so re-imports never silently clobber human edits and upstream removals never destroy
> data. Built on the provenance model in
> [`CANONICAL_LISTING_CONTRACT.md`](./CANONICAL_LISTING_CONTRACT.md).

**Default stance:** the **feed is the source of truth for facts** (price, beds, address,
status) **until a TrueDeed user edits a field**, at which point that field becomes
**TrueDeed-owned** (`field_provenance[field] = 'truedeed_edit'`) and is protected from
feed overwrite — with a visible "diverged from feed" flag the agent can resolve.

---

## Conflict scenarios

| # | Scenario | Policy | Mechanism |
|---|---|---|---|
| S1 | Feed updates a field the user **never edited** | **Feed wins** — apply update | `field_provenance[field] == 'feed'` → overwrite |
| S2 | Feed updates a field the user **edited in TrueDeed** | **TrueDeed wins**; record a *pending divergence* and surface it in Review | `'truedeed_edit'` → do **not** overwrite; store feed value in `features._feed_pending[field]` |
| S3 | Feed **price** changes | Apply (S1) → fires `trg_track_price_changes` → `price_history` row | reuse existing trigger (`003001:201`) |
| S4 | Feed **status** → `withdrawn`/absent | **Archive** the listing (`status='withdrawn'`/`archived`), keep the row + media; audit | soft-archive, never DELETE (matches `deleteListing`) |
| S5 | Feed item **absent** from a full-snapshot pull (Jupix model) | Treat as removal **only if** the empty-feed guard passed (feed non-empty & ≥ threshold of last-known); else **hold** and alert | compare `feed_listing_links.last_seen_run_id`; guard in `runImport` |
| S6 | Feed re-sends an item already published (same `external_id`) | **Upsert**, don't duplicate | `feed_listing_links UNIQUE(integration_id, external_listing_id)` → update existing `listing_id` (fixes C16 dup defect) |
| S7 | User **deletes** a TrueDeed listing that still exists upstream | TrueDeed delete wins (soft); next pull must **not** resurrect it | mark `feed_listing_links` as user-suppressed; skip on re-import |
| S8 | Feed media changes (new/removed photos) | Add new (SSRF-checked); remove ones no longer present **unless** user-pinned | `feed_media_links` diff by `external_media_id` + `source_sha256` |
| S9 | Feed sends a field that **fails validation** (e.g. missing tenure) | Item stays `needs_review` with `validation_errors`; **not published**; existing published row **unchanged** | `validateNormalizedListing` (HTTP 200 ≠ success) |
| S10 | Feed sends a **new branch** | Create `feed_branch_links`; map to `agent_branches` (or prompt to create) | branch mapping in Review |
| S11 | Two integrations claim the **same external listing** | Reject the second link | `UNIQUE(integration_id, external_listing_id)` is per-integration; cross-integration collision → flag for manual resolution |
| S12 | Feed lowers data quality (e.g. blanks description that was populated) | Treat blanking as S2 if user-edited, else apply but **warn** in Review | provenance + non-empty heuristic |
| S13 | Provider connection removed/disconnected | **Freeze** linked listings (no further auto-updates); do **not** archive | `sync_status='disconnected'`; listings retain last state |
| S14 | Coordinates: feed supplies lat/lng vs TrueDeed geocode | Prefer **TrueDeed geocode** (consistent with first-party path) unless feed coord is higher precision | `set_property_coordinates` on publish |

## Empty-feed guard (the safety check, expanded)

Triggered before any archival sweep (S4/S5):

1. If `result.listings.length === 0` **and** connector lacks `tombstones` capability →
   abort run `status='failed'`, audit `empty_feed_aborted`, **archive nothing**.
2. If the pull is non-empty but `< X%` (proposed 50%, product-decision) of the
   last-known active count → **hold** archival, mark run `needs_review`, alert the agent.
3. Only a healthy full snapshot may drive archival of absent items.

## Audit

Every policy decision (overwrite, hold-divergence, archive, suppress, dedup-upsert)
writes to the run/item ledger (`feed_import_runs.error_log` / item status transitions)
and — where a separate audit log exists — an audit entry. No silent resolution: S2/S5/S11
must be surfaced in the Review UI, consistent with the project's source-of-truth memory
("record conflicts — don't silently resolve").
