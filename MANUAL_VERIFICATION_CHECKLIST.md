# Britestate — Pre-Launch Manual Verification Checklist

Companion to `SECURITY_AUDIT_REPORT.md`. These items **cannot** be confirmed by
source review or CI — an operator with console/hosting access must verify them
before inviting early users. Generated alongside the BRIT-S0xx remediation
(2026-06-16).

> **Local Supabase is broken** (NOW()-in-index migration). The three migrations
> authored in this remediation were statically reviewed only — they must be
> applied and verified in **staging** before production.

---

## 1. Apply + verify the new migrations (staging first)

| Migration | What it does | Verify after apply |
|---|---|---|
| `20260616000000_restrict_profile_fk_cascades.sql` | Marketplace FKs to `profiles(id)` → `ON DELETE RESTRICT`; adds `gdpr_purge_log` + `purge_user()` | `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid='public.profiles'::regclass;` → all marketplace FKs show `r` (restrict). A direct `DELETE FROM profiles WHERE id=<test>` with marketplace rows must now **error**, not cascade. |
| `20260616000001_storage_bucket_policies.sql` | `avatars` public-read/owner-write, `landlord-documents` private/owner-scoped | Reconcile with existing console policies **before** apply (DROP POLICY IF EXISTS guards re-runs). Then test cross-user access is denied. |
| `20260616000002_activity_log_partition_maintenance.sql` | `ensure_activity_log_partitions()` + backfill | `SELECT public.ensure_activity_log_partitions(12);` returns ≥0; confirm partitions exist past 2027-02. Confirm Inngest cron `activity-log-partitions` is registered/firing. |

## 2. Supabase Storage policies (BRIT-S014)

- [ ] Studio → Storage → Policies for **every** bucket (`avatars`, `landlord-documents`, `listings`, `profiles`, `buyer-documents`, `expense-receipts`, `maintenance-photos`, `property-documents`).
- [ ] Confirm `landlord-documents` and other private buckets have **no anon `SELECT`** policy (signed-URL access only).
- [ ] Confirm `avatars` is public-read but write-restricted to the owner folder.
- [ ] Export any console-only policies into a migration so they are version-controlled.

## 3. Supabase RLS spot-check

- [ ] For each table in `002_marketplace.sql`, `003_dashboards_communication.sql`, `010_admin.sql`: confirm **RLS is enabled** in the dashboard (runtime can drift from migration text).
- [ ] Run `scripts/audit/rls-policy-audit.ts` if current.

## 4. JWT custom-claims trigger (middleware fast path)

- [ ] Confirm the Supabase Auth trigger populates `app_metadata.role / plan / is_admin` on the JWT.
- [ ] Confirm it fires on **signup** and on **subscription state changes** (the middleware JWT fast path depends on these claims).

## 5. Production environment variables (hosting platform)

Confirm present and non-empty in Vercel (or host) — none committed to the lockfile:

- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] `INNGEST_SIGNING_KEY` — **now required at boot in production** (BRIT-S010); a missing value fails `pnpm build`/start.
- [ ] `RESEND_API_KEY`, `ANTHROPIC_API_KEY`
- [ ] `PUSH_SECRET` — now the **HMAC key** for signed push requests (BRIT-S008), not a static bearer.
- [ ] `REAUTH_HMAC_SECRET`, `QUOTE_SIGNING_SECRET`
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — required for the push per-user rate limit to actually enforce (it fails **open** without Redis).
- [ ] `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- [ ] `SENTRY_DSN` (server) + `NEXT_PUBLIC_SENTRY_DSN` (client)

## 6. Stripe dashboard

- [ ] Webhook signing secret in the dashboard matches `STRIPE_WEBHOOK_SECRET` in prod env.
- [ ] Registered endpoint is HTTPS.

## 7. HSTS (BRIT-S003)

- [ ] After deploy: `curl -I https://britestate.co.uk` shows `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- [ ] 30 days post-deploy with clean HTTPS: submit to https://hstspreload.org.

## 8. Sentry project settings (BRIT-S005, defence-in-depth)

- [ ] Code now sets `sendDefaultPii: false`, `beforeSend` cookie/auth scrub, and replay `maskAllText`/`blockAllMedia`.
- [ ] In the Sentry project, also enable inbound **PII filters** and **IP scrubbing** as a second layer.
- [ ] Schedule a quarterly review of what Sentry has actually ingested.

## 9. CSP rollout (defence)

- [ ] Deploy a `Content-Security-Policy-Report-Only` variant to **staging** first to catch inline-style / third-party-script regressions before enforcing on early users.

## 10. Push secret rotation procedure (BRIT-S008)

- [ ] Document and test rotating `PUSH_SECRET`: update the env var, redeploy; in-flight signed requests fail closed (403) after the skew window. Internal callers should emit the `notifications/push.send` Inngest event (platform-signed) rather than calling the HTTP route directly.

## 11. Dependency posture (BRIT-S002)

Remediated 2026-06-16: `pnpm audit` went from **2 critical / 37 high → 0 critical / 3 high**.
Patched via `next`→16.2.9, `@sentry/nextjs`→^10.58.0, `vitest`→^4.1.9, explicit
`vite`@^7.3.5, and `overrides` in `pnpm-workspace.yaml` (protobufjs, undici, lodash,
dompurify, path-to-regexp, picomatch, ws, fast-uri, flatted, happy-dom, esbuild,
@grpc/grpc-js — each pinned to the latest patched release *within the same major*).

**Accepted residual (3 high, one advisory — GHSA-q7rr-3cgh-j5r3):**
`@opentelemetry/{auto-instrumentations-node,sdk-node,exporter-prometheus}` —
"Prometheus exporter process crash via malformed HTTP request." Pulled transitively
by `@sentry/nextjs` (latest 10.58.0 still pins the older otel wave).
- **Why accepted:** the vulnerable path is the **Prometheus metrics exporter HTTP
  server**, which this app does **not** expose. Unreachable in production.
- **Why not force-fixed:** the otel suite is 75 interdependent packages on a synchronized
  release; overriding 3 of them forward while Sentry pins the rest risks breaking error
  monitoring — a bad trade for an unreachable DoS.
- **Action:** revisit when a future `@sentry/nextjs` bundles patched otel (≥0.75 /
  ≥0.217), then drop this note. Until then there are **0 critical / 0 reachable high**.

- [ ] Re-run `pnpm audit` quarterly; budget time to land patches within 7 days of disclosure.
- [ ] On each `@sentry/nextjs` upgrade, re-check whether the otel advisory clears.

---

## Follow-up bug noted during remediation (not in audit scope)

- `src/app/api/properties/[id]/book-viewing/route.ts` queries `viewing_slots` by a
  non-existent `property_id` column (the table uses `listing_id`). The GET
  `viewing-slots` route was fixed (BRIT-S015); this sibling POST path likely
  500s on the same drift and should be reconciled the same way.
