# Partner Connector Architecture

> **Date:** 2026-06-19
> **Gate:** A (design proposal — not yet built).
> **Purpose:** define the adapter-based `SourceConnector` contract so every source
> (CSV, generic sandbox, Reapit, Alto, Jupix, future Rightmove/Zoopla/OTM) plugs into
> **one** ingest pipeline that writes the existing import ledger and publishes through
> the existing listing-service.

Cross-refs: [`ESTATE_AGENT_LISTING_DISTRIBUTION_RESEARCH.md`](./ESTATE_AGENT_LISTING_DISTRIBUTION_RESEARCH.md),
[`CANONICAL_LISTING_CONTRACT.md`](./CANONICAL_LISTING_CONTRACT.md),
[`CURRENT_LISTING_DATA_FLOW.md`](./CURRENT_LISTING_DATA_FLOW.md).

---

## 1. Principle

Codex's pipeline already has the right *spine* —
`normalize → validate → ledger → review → approve → publish`
(`src/services/agent/agent-feed-import-service.ts`). The only thing hardcoded is the
**source** (`normalizeReapitFixture`). Extract that into a connector interface; keep
everything downstream unchanged.

```
SourceConnector ──▶ NormalizedFeedListing[] ──▶ [existing pipeline]
   (CSV / sandbox /                                ledger → review →
    Reapit / Alto / Jupix / …)                     approve → publish
```

## 2. The `SourceConnector` contract (proposed)

```ts
// src/services/agent/connectors/source-connector.ts  (proposed)
import type { NormalizedFeedListing } from "../agent-feed-import-service";

export type ConnectorCapability =
  | "full_snapshot"      // emits the complete current portfolio (Jupix nightly XML, CSV)
  | "incremental"        // emits deltas since a cursor (Reapit pagination/metadata)
  | "webhook_push"       // provider pushes changes (Reapit/Street webhooks)
  | "tombstones"         // explicitly signals removals (vs "absent = removed")
  | "media_urls"         // supplies remote media URLs to fetch
  | "branches";          // supplies branch structure

export type FetchResult = Readonly<{
  listings: NormalizedFeedListing[];
  /** SHA256 over the raw source payloads — the run idempotency key. */
  sourceFingerprint: string;
  /** Branch records seen this run (for feed_branch_links). */
  branches: ReadonlyArray<{ externalId: string; name: string; postcode?: string }>;
  /** Provider/transport diagnostics. HTTP 200 here does NOT imply per-item success. */
  transport: { ok: boolean; itemsSeen: number; warnings: string[] };
}>;

export interface SourceConnector {
  readonly provider: string;                 // 'csv' | 'sandbox' | 'reapit' | ...
  readonly capabilities: ReadonlySet<ConnectorCapability>;
  /** Validate credentials / file WITHOUT importing. Must actually probe the source. */
  testConnection(ctx: ConnectorContext): Promise<{ ok: boolean; message: string }>;
  /** Pull (or accept-pushed) the current set; normalize to canonical shape. */
  fetch(ctx: ConnectorContext): Promise<FetchResult>;
}

export type ConnectorContext = Readonly<{
  integrationId: string;
  organisationId: string;        // (post-org-migration; agentId pre-migration)
  /** Resolved secret from Vault — never the placeholder reference. */
  credential: ConnectorCredential;
  fieldMapping?: Record<string, string>;
  cursor?: string | null;        // for incremental connectors
  /** For CSV/upload connectors: the uploaded object handle. */
  uploadRef?: string;
}>;
```

`fetch()` returning `transport.ok = true` is **explicitly not** a success signal for any
listing — item-level `validateNormalizedListing` still governs publish eligibility
(encodes the "HTTP 200 ≠ import success" non-negotiable).

## 3. Per-connector capability map (from research)

| Connector | `full_snapshot` | `incremental` | `webhook_push` | `tombstones` | `media_urls` | `branches` | Removal semantics |
|---|---|---|---|---|---|---|---|
| **CSV** (pilot) | ✓ | – | – | inference (absent = removed) | ✓ (URLs in cells) | optional col | absent rows → archive (empty-feed guard!) |
| **Sandbox/generic** (pilot) | ✓ | optional | – | ✓ (explicit status) | ✓ | ✓ | explicit `withdrawn` (matches current fixture) |
| **Reapit** | ✓ (paged) | ✓ | ✓ | ✓ (soft DELETE) | ✓ (signedUrl ≤30MB) | ✓ | soft-delete event / absent on paged refresh |
| **Alto** | ✓ (export) | unknown-commercial | – | unknown | ✓ | ✓ | export-set diff |
| **Jupix** | ✓ (nightly XML) | – | – | ✗ **absent = removed** | ✓ (with property) | ✓ | **absent → must tombstone** |
| **Rightmove RTDF** | reconcile via Get-branch-property-list | ✓ (Send/Remove) | n/a (push to portal) | ✓ (Remove call) | ✓ | branch-scoped | explicit Remove |
| **Zoopla/OTM** | via feed provider | provider-dependent | – | provider-dependent | ✓ | branch-ID | provider-dependent |

> **Jupix is the riskiest removal model** ("removed properties will not be provided in the
> feed so should be removed from your system"): it demands the **empty-feed guard** + the
> archive-not-delete policy, because a transient empty/partial nightly file would otherwise
> mass-archive a portfolio. See [`LISTING_SOURCE_OF_TRUTH_POLICY.md`](./LISTING_SOURCE_OF_TRUTH_POLICY.md).

## 4. Pipeline integration points (reuse, don't fork)

1. `runImport(connector, ctx)`:
   - `result = await connector.fetch(ctx)`
   - **empty-feed guard:** if `result.listings.length === 0` and the connector lacks
     `tombstones`, abort with `status='failed'` + audit (never archive on an empty pull).
   - write `feed_import_runs` (reuse `UNIQUE(integration_id, source_fingerprint)` idempotency)
     and `feed_import_items` (reuse SHA256 + `UNIQUE(run_id,item_type,external_id)`).
2. Review/approve: **unchanged** (`approveEligibleFeedImportRunItems`).
3. Publish: **change to reuse `createListing` + `uploadPropertyImage`** (so it inherits
   geocoding, MV refresh, slug/tsv, publish guard), then upsert against
   `feed_listing_links.external_listing_id` to **fix the duplicate-on-re-publish defect**
   (C16–C19 in the capability matrix).
4. Async: dispatch `runImport` via **Inngest**, mirroring `truedeed-ppd-ingest.ts`
   (SHA dedup + run ledger + audit are already the same shape).

## 5. Recommended implementation order

| Phase | Build | Why first |
|---|---|---|
| 1 (P0) | Extract `SourceConnector`; port the Reapit fixture into a **`SandboxConnector`**; add a **`CsvConnector`**; fix publish (reuse `createListing`, upsert links); empty-feed guard; SSRF allowlist; cross-tenant denial tests | Delivers a *real* working 3-action onboarding on synthetic data with no credentials, and removes the four publish defects. |
| 2 (P1) | Org model migration; org-aware auth; field-mapping applied in normalize; async Inngest dispatch; upstream-deletion archive job | Productionises tenancy + operability. |
| 3 (P2) | **Reapit** live connector (OIDC, `reapit-customer` header, signedUrl media, webhooks) | Best-documented public API; sandbox with `SBOX`; OTM real-time precedent. |
| 4 (P2) | Alto / Jupix; then portal *outbound* (Rightmove RTDF, Zoopla/OTM branch-ID) | Require commercial credentials / contracts. |

## 6. Pilot recommendation (with evidence)

**Build anchor: CSV connector + Sandbox connector** (no credentials, ship now). Then
**first live pilot = Reapit Foundations**, on this evidence:

- **Public, complete docs** (REST/JSON, HAL, pagination, error envelope with
  `x-amzn-RequestId`) — *confirmed-official*, unlike Alto/Jupix whose specs are gated or a
  decade old (research §2 conflicts #2).
- **Standard OAuth2/OIDC** via Reapit Connect with a **machine-to-machine
  Client-Credentials** flow and a **public sandbox** (`SBOX` customer) — testable before any
  agency signs up (*confirmed-official*).
- **Customer-scoped install consent** (`reapit-customer` header; admin must install the app)
  — clean tenant-isolation story that maps onto our RLS model (*confirmed-official*).
- **Webhooks + incremental pagination** — supports both batch reconcile and real-time,
  covering all `ConnectorCapability` values (*confirmed-official*).
- **Ecosystem precedent**: Reapit already runs a real-time feed to OnTheMarket
  (*provider-reported*), proving the data shape distributes cleanly.

Do **not** pre-pick Alto/Jupix as first live: Alto's API guide is gated (can't verify auth)
and the Jupix spec is v2/2014 with an absent-equals-removed model that is operationally
hazardous without the empty-feed guard in place.
