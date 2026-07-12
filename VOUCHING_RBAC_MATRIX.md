# Vouching RBAC Matrix — Post-Fix

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12 (post-fix update)

Roles audited: **Anonymous · Invited referee (unregistered) · Registered customer · Registered trader (subject) · Support/Verification admin · Super admin · dev_admin.**

Admin capabilities grounded in `src/lib/admin-permissions.ts`. Real admin roles: `super_admin | moderation_admin | ops_admin | dev_admin`. "Support/Verification admin" map onto the real permission `manage_verifications`, held by `super_admin`, `moderation_admin`, `ops_admin`.

Legend for "Where enforced": **FE** = frontend gate · **BE** = server route/service · **DB** = RLS/constraint · **SR** = service-role (bypasses RLS, gated by route auth/token) · **ALL** = FE+BE+DB.

> **CONFIRMED vs UNTESTED-LIVE.** DB-layer authz (RLS, immutability, uniqueness) is **CONFIRMED** by `db-tests/provider-references-vouching.test.ts` (37/37, real Postgres). Route-level server authz is unit-tested. The full live path is **UNTESTED-LIVE** pending migration apply (see `VOUCHING_SYSTEM_AUDIT.md §17`).

---

## 1. `provider_references` table (the vouch rows) — RLS

| Role | View | Create | Update (status/text) | Delete | Where enforced | Notes |
|------|------|--------|----------------------|--------|----------------|-------|
| Anonymous | ❌ | ❌ | ❌ | ❌ | DB | no anon policy; referee path is service-role + token, not anon RLS |
| Invited referee (unregistered) | ❌ (direct) | ❌ | ✅ **via service-role token only** | ❌ | SR | submit/decline run through the service-role client, gated by a valid single-use token — never direct table access |
| Registered customer | ❌ | ❌ | ❌ | ❌ | DB | no matching policy |
| **Registered trader (subject)** | ✅ own | ❌ **(REMOVED)** | ❌ **(REMOVED)** | ❌ **(REMOVED)** | DB | `provider_references_select_own` USING `provider_id = auth.uid()` (`20260712100002:90-92`); insert/update/delete-own **DROPped** (`:83-85`) — **the fix** |
| Trader writes (create/resend/cancel) | — | ✅ | ✅ | — | SR+BE | go through `/api/provider/references*` (service-role), never RLS; gated by cookie-auth + provider check (403 for non-providers) |
| Support/Verification admin | ✅ | ❌ | ✅ (review) | ❌ | DB | `provider_references_admin_select` + `_admin_update` USING `is_admin` (`:96-106`); admin review runs in user-context so needs real RLS write |
| Super admin | ✅ | (via SR) | ✅ | (via SR) | DB/SR | holds `manage_verifications`; is_admin covers RLS |

**Identity-immutability (all UPDATE paths):** a BEFORE UPDATE trigger `prevent_provider_reference_identity_change` freezes `provider_id`, `referee_email`, `reference_type` — so even admin/service-role UPDATEs cannot reassign a row to another provider or rewrite the referee identity (`20260712100002:113-128`). **CONFIRMED** by db-test.

## 2. Sensitive fields on a reference

| Field | Who can write (post-fix) | Where enforced |
|-------|--------------------------|----------------|
| `status` | referee (`submitted`/`declined`, via token+SR) · admin (`verified`/`rejected`/`flagged`, RLS admin-update) · service (`sent`/`expired`/`revoked`) | SR / DB(admin) |
| `reference_text` | referee only, via tokenised submission (SR) | SR |
| `verified_at` | admin verify only (`reviewReference`) | SR/DB(admin) |
| `reviewed_by` / `reviewed_at` / `review_reason` | admin review only | SR/DB(admin) |
| `invite_token_hash` | service (Inngest set; NULLed on response) — never client-writable | SR |
| `provider_id` / `referee_email` / `reference_type` | **immutable after insert** (trigger) | DB (trigger) |

The subject trader has **no write path to any of these** — the pre-fix forge (V-01) is closed and proven.

## 3. Provider verification status (`profiles.provider_verification_status`)

| Role | View own | View others | Change (approve/reject) | Where enforced | Evidence |
|------|----------|-------------|--------------------------|----------------|----------|
| Anonymous | ❌ | ✅ only if `verified` | ❌ | DB | anon RLS `017_public_profiles.sql`; badge `ProviderSearchCard.tsx` |
| Registered customer | ✅ self | ✅ verified providers | ❌ | DB | — |
| Registered trader (subject) | ✅ | — | ❌ | ALL | proxy gate; cannot self-approve |
| Support/Verification admin (`manage_verifications`) | ✅ | ✅ | ✅ (gate-aware) | ALL | route perm + `reviewVerification`; approve is gate-aware when `gate_enabled` |
| Super admin | ✅ | ✅ | ✅ | ALL | holds all perms |
| `dev_admin` | ✅ | ✅ | ❌ | BE | lacks `manage_verifications` |

## 4. `verification_vouch_rules` (gate config) — RLS

| Role | Read | Write | Where enforced | Evidence |
|------|------|-------|----------------|----------|
| Anonymous | ❌ | ❌ | DB | policy requires `auth.uid() IS NOT NULL` |
| Any authenticated (incl. trader) | ✅ | ❌ | DB | `verification_vouch_rules_read` (`20260712100003:36-39`) — services need thresholds |
| Admin (`is_admin`) | ✅ | ✅ | DB+BE | `verification_vouch_rules_admin_write` (`:42-46`); edits via audited `PUT /api/admin/vouch-rules` |

## 5. Routes & server-side authz

| Route / action | Auth model | Guards / status codes | Where enforced |
|----------------|-----------|-----------------------|----------------|
| `POST /api/provider/references` | cookie-auth (provider) | 401 unauth · 403 non-provider · 422 self-vouch · 409 duplicate-active · 429 >5/hr · 201 ok | BE — `route.ts` (service-role write) |
| `POST /api/provider/references/[id]/resend` | cookie-auth | 429 cooldown; max-sends | BE |
| `POST /api/provider/references/[id]/cancel` | cookie-auth | → status `revoked` | BE |
| `GET /reference/[token]` (public) | token (in URL) | robots noindex; NO internal ids exposed; service-role resolve | BE+SR (`/reference` in PUBLIC_ROUTES) |
| `POST /api/references/[token]/submit` | token IS the auth | 5/hr/IP fail-open; 200/409/410/404/400; constant-time hash compare; no ids in body; generic invalid (no enumeration) | BE+SR |
| `POST /api/references/[token]/decline` | token | single-use | BE+SR |
| `POST /api/admin/references/[id]/review` | admin `manage_verifications` | UUID-guards id; `reason_required→400`, `invalid_state→409`, `not_found→404`; logs `metadata:{decision,reason}` | BE — `auditedAdminActionWithPermission` |
| `PUT /api/admin/vouch-rules` | admin | audited | BE |
| `/admin/verifications` + `/[userId]` | admin `manage_verifications` | queue + per-trader detail | ALL |

## 6. Key RBAC findings (post-fix)

1. ✅ **CRITICAL V-01 CLOSED (proven).** The subject trader has **no write** on their own vouch rows — insert/update/delete-own policies DROPped, all trader writes routed through service-role API, identity columns immutable via trigger. `db-tests/provider-references-vouching.test.ts` (37/37) proves the forge is denied while select-own and admin access hold.
2. ✅ **Referee is now a real, least-privilege actor** — no table access; acts only through a service-role endpoint gated by a single-use, expiring, sha256-hashed token. No account required (guest path); account-linking is REMAINING (R12).
3. ✅ **Admins now reach individual references** — `is_admin` RLS select+update + a permissioned review route (`manage_verifications`), replacing the pre-fix "admin only touches profiles status".
4. ✅ **Gate config is correctly scoped** — authenticated-read (services need thresholds), admin-write only.
5. ✅ **Admin review gating correct** — `manage_verifications` enforced at the route boundary; `dev_admin` correctly cannot review. Decisions are audit-logged with metadata.
6. **Live caveat:** all of the above is CONFIRMED at the DB (db-test) and unit-tested at the routes, but **UNTESTED-LIVE** until migrations are applied to the target DB.
