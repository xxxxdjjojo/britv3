# Partner Ingestion Roadmap

> **Date:** 2026-06-19
> **Gate:** A. Gated A→E plan. Each gate has an exit criterion; do not advance until met.

Cross-refs: [`PARTNER_INGESTION_GATE_A_REPORT.md`](./PARTNER_INGESTION_GATE_A_REPORT.md),
[`PARTNER_CONNECTOR_ARCHITECTURE.md`](./PARTNER_CONNECTOR_ARCHITECTURE.md).

---

## Gate A — Discovery & design *(this package)*

- Research UK distribution (done), audit codebase (done), data flow + dictionary (done),
  capability matrix, connector contract, canonical contract, source-of-truth policy,
  3-action spec, security review, TDD plan, traceability.
- **Exit:** product signs off the connector contract, the org-migration path, and the
  pilot recommendation; "decisions needed" answered.

## Gate B — Working build on synthetic data (no credentials)

- Extract `SourceConnector`; port Reapit fixture → `SandboxConnector`; add `CsvConnector`.
- Widen `agent_feed_integrations.provider` CHECK to include `csv`,`sandbox`,`generic`.
- **Fix the four MVP defects:** publish via `createListing` (geocode+MV+slug+guard),
  upsert links (no duplicates), publish `active` (searchable), set coordinates (map marker).
- Empty-feed guard; SSRF allowlist; cross-tenant denial tests D1–D6.
- Add provenance columns (`CANONICAL_LISTING_CONTRACT.md` option B).
- Seed `e2e/.auth/agent.json`; land E1–E13 + screenshots.
- **Exit:** an agent onboards a synthetic portfolio Connect→Review→Publish; published
  listings are searchable + mapped; re-import is idempotent; all P0 capability rows green;
  `pnpm lint` 0, `pnpm build` exit 0, full `pnpm test` + `pnpm test:e2e` green.

## Gate C — Tenancy + operability

- Org migration (additive): `organisations`/`organisation_memberships`; backfill from
  `agent_id`; re-key RLS; org-aware `require-agent`.
- Async dispatch via Inngest (mirror `truedeed-ppd-ingest.ts`); run error surfacing.
- Vault-backed secrets (replace placeholder reference).
- Source-of-truth conflict UI (divergence resolution).
- **Exit:** multi-user agency works; secrets in Vault; imports run async with audit.

## Gate D — First live connector (Reapit)

- Reapit Foundations: OIDC client-credentials, `reapit-customer` header, paged incremental,
  signed-URL media (SSRF-checked), webhooks (Stripe-pattern signature+replay).
- Contract tests promoted to live sandbox (`SBOX`) tests behind a credentials flag.
- **Exit:** a real Reapit sandbox agency onboards end-to-end; webhook updates flow;
  upstream deletes archive.

## Gate E — More connectors + outbound distribution

- Alto, Jupix (nightly XML / Client Feed Export) once credentials/specs confirmed
  (resolve research conflict #2).
- **Outbound** portal distribution (Rightmove RTDF three-call contract, Zoopla/OTM
  branch-ID onboarding) — separate commercial track, gated on contracts and GO-LIVE calls.
- **Exit:** agencies can both ingest from CRMs and (optionally) distribute to portals.

---

## Dependency notes

- B is independent of credentials — ship it first.
- C's org migration is additive and can overlap B's tail.
- D/E require commercial credentials/contracts (unknown-commercial in research).
