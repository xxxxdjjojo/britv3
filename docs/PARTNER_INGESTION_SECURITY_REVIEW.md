# Partner Ingestion Security Review

> **Date:** 2026-06-19
> **Gate:** A (security design + threat model).
> **Scope:** tenant isolation, secret storage, SSRF on feed/media URLs, webhook
> signature+replay, and the six cross-tenant denial tests. Every claim cites a file.

Cross-refs: [`PARTNER_INGESTION_CODEBASE_AUDIT.md`](./PARTNER_INGESTION_CODEBASE_AUDIT.md),
[`PARTNER_INGESTION_TDD_PLAN.md`](./PARTNER_INGESTION_TDD_PLAN.md).

---

## 1. Tenant isolation

**Current posture (verified):**
- Ledger RLS is `SELECT … USING (agent_id = (SELECT auth.uid()))` on all five tables
  (`20260619120003_agent_feed_import_ledger.sql:130–163`) — **select-only**; no agent
  INSERT/UPDATE/DELETE, so writes are service-role.
- Tenant-consistency triggers `assert_feed_*_tenant()` (SECURITY DEFINER, `SET search_path
  = public`) reject any row whose `integration_id`/`listing_id`/`branch_id`/`media_id`
  does not belong to `agent_id` (`:165–318`). This defends even against a buggy
  service-role writer.
- `listings` ownership is `user_id = auth.uid()` (`003001:537–549`).

**Risks / actions:**
- Writes go through `createAdminClient()` (service role) in the sync/approve/publish
  routes — RLS is **bypassed**, so correctness depends entirely on the explicit
  `.eq("agent_id", agentId)` filters in the service + the triggers. **Action:** keep
  every service query `.eq("agent_id"/"user_id", caller)`; never trust the route param
  alone. The triggers are the backstop.
- Post-org-migration, re-key isolation to `organisation_id IN (memberships)` (onboarding
  spec §6) and re-write the six denial tests against org boundaries.

## 2. Secret storage (`api_key_encrypted`)

**Current (verified):** `createSecretReference()` returns
`vault://<agentId>/<provider>/<uuid>` — a **non-secret placeholder string**, not a real
secret (`agent-feed-service.ts:32`). The real key from the Connect form is **not
persisted** anywhere server-side beyond this reference. API responses already strip
`api_key_encrypted` (`toFeedIntegrationView`, `redactFeedIntegration`).

**Required for production:**
- Back the reference with **Supabase Vault** (or an equivalent server-side secret
  manager). `agent_feed_integrations.api_key_encrypted` should store the Vault secret
  **id/path**, and the actual secret lives in Vault, fetched server-side only at connect
  time by `SourceConnector.fetch`/`testConnection`.
- Never log the secret. `feeds/route.ts` uses `console.error` (eslint-disabled, TODO to
  Sentry) — ensure error objects never include the resolved credential (C43).
- OAuth connectors (Reapit) hold `client_id`+`secret` and tokens — store both in Vault;
  rotate; never in `field_mapping`/`features`/`raw_payload`.

## 3. SSRF — feed URLs and media URLs

**Threat:** a feed/connector supplies a `source_url` (media) or a feed endpoint URL that
points at internal infrastructure (`http://169.254.169.254/…`, `http://localhost:…`,
RFC1918, `file://`, redirect-to-internal). The publish path inserts `feed_media_links.
source_url` and `property_media.url` **unvalidated** today
(`agent-feed-import-service.ts:553`, `:588`) and a real connector will *fetch* media.

**Allowlist policy (required before any connector fetches a URL):**
- Scheme allowlist: `https:` only (no `http:`, `file:`, `data:`, `gopher:`).
- Resolve DNS and **reject** if the resolved IP is in: loopback, RFC1918
  (10/8, 172.16/12, 192.168/16), link-local (169.254/16, fe80::/10), ULA (fc00::/7),
  multicast, `0.0.0.0/8`, IPv4-mapped IPv6 of the above.
- **Re-validate after every redirect** (no following a 30x into an internal host) and cap
  redirects.
- Per-provider host allowlist where known (e.g. Reapit S3 signed-URL host).
- Size + content-type caps on fetched media; timeout.
- This mirrors why `set_property_coordinates` geocoding uses a fixed external host
  (postcodes.io), not arbitrary URLs.

## 4. Webhooks (provider push)

The UI advertises `…/api/agent/feeds/webhook/<id>` but **no handler exists**
(`FeedIntegrationConfig.tsx:602`, audit C35). When built, reuse the **Stripe webhook
template** (`src/app/api/webhooks/stripe/route.ts`, verified facts):
- **Raw-body signature verification** (`constructEvent` analogue) — verify the provider's
  HMAC/signature over the *raw* body before parsing.
- **Idempotency / replay protection** — dedupe by event id; duplicate → `200` no-op
  (Stripe route already does this). Persist payload for **DLQ replay**.
- **Unknown event types → 200** so the provider doesn't retry-storm.
- **HTTP 200 ≠ import success** — a verified webhook still enters the ledger and passes
  per-item validation before anything publishes.
- Until a real handler with signature verification exists, **remove the advertised
  webhook URL from the UI** (don't expose an unauthenticated ingestion endpoint).

## 5. The six cross-tenant denial tests (must all pass)

Agent **B** must be denied access to Agent **A**'s data at the API/RLS layer:

| # | Attempt | Expected | Enforced by |
|---|---|---|---|
| D1 | B reads A's `feed_import_runs` | denied (empty/403) | ledger RLS `agent_id=auth.uid()` |
| D2 | B reads A's `feed_import_items` | denied | ledger RLS |
| D3 | B approves A's run (`/feed-imports/<A.runId>/approve`) | denied (service `.eq("agent_id", B)` matches nothing) | service filter + `requireAgent` |
| D4 | B publishes A's run | denied | service filter |
| D5 | B's link row references A's `listing_id`/`branch_id` | **trigger raises** `… tenant mismatch` | `assert_feed_*_link_tenant()` |
| D6 | B reads A's `agent_feed_integrations` (incl. secret ref) | denied + key never returned | integration RLS + `redactFeedIntegration` |

These are P0 and currently **Missing** (capability matrix C28). They go in the TDD plan
as DB-level (RLS/trigger) + API-level (route) tests.

## 6. Other

- **No fabricated data:** validation rejects empty material-info fields; connectors must
  not synthesize values to pass the gate (sandbox fixtures are clearly labelled synthetic).
- **Archive not delete** for upstream removals (source-of-truth S4) — prevents data loss
  and preserves audit.
- **Input validation at the boundary:** Zod schemas on `feeds/route.ts` are `.strict()`;
  keep connector payloads schema-validated before normalize.
- **Least privilege:** ledger writes need `SUPABASE_SERVICE_ROLE_KEY`; keep it server-only.
