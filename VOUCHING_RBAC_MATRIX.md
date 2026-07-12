# Vouching RBAC Matrix — Current State (Pre-Fix)

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12

Roles audited: **Anonymous · Invited non-registered user · Registered customer · Registered trader · Trader being vouched-for · Voucher · Support admin · Verification admin · Super admin.**

Admin capabilities are grounded in `src/lib/admin-permissions.ts`. The admin roles that exist are `super_admin | moderation_admin | ops_admin | dev_admin` (`admin-permissions.ts:1`). "Support/Verification admin" below map onto the real permission `manage_verifications`, which is held by `super_admin`, `moderation_admin`, and `ops_admin` (`admin-permissions.ts:37,46,53`).

Legend for "Where enforced": **FE** = frontend gate only · **BE** = server route/service · **DB** = RLS/constraint · **ALL** = all three · **—** = not applicable/absent.

---

## 1. `provider_references` table (the vouch rows)

| Role | View | Create | Update (status/text) | Delete/Revoke | Where enforced | Notes |
|------|------|--------|----------------------|---------------|----------------|-------|
| Anonymous | ❌ | ❌ | ❌ | ❌ | DB | no anon policy on `provider_references` (only owner policies exist, `20260316100001:148-183`) |
| Invited non-registered user | ❌ | ❌ | ❌ | ❌ | DB | **no token/anon path** — cannot submit a vouch (NOT_IMPLEMENTED) |
| Registered customer | ❌ | ❌ | ❌ | ❌ | DB | owner-only policies key on `service_provider_details.user_id`; a plain customer has no provider row |
| Registered trader (own rows) | ✅ | ✅ | ⚠️ **YES** | ✅ | DB | `_select/_insert/_update/_delete_own` (`:148-183`) |
| **Trader being vouched-for (subject)** | ✅ own | ✅ own | 🔴 **INSECURE — can self-set `verified` + fabricate `reference_text`** | ✅ own | DB | `provider_references_update_own` (`:164-175`) — **finding V-01** |
| Voucher (the referee) | ❌ | ❌ | ❌ | ❌ | DB | no referee identity/policy exists (NOT_IMPLEMENTED) |
| Support admin (`manage_verifications`) | ❌ direct | ❌ | ❌ | ❌ | DB | no admin policy on `provider_references`; admin only touches `profiles` status (§3) |
| Verification admin | ❌ direct | ❌ | ❌ | ❌ | DB | same — **no per-reference admin write** |
| Super admin | ❌ direct (via RLS) | ❌ | ❌ | ❌ | DB | would need service-role/bypass; no app path today |

🔴 = the flagged INSECURE row (self-forgeable verified vouch).

## 2. Sensitive fields on a reference

| Field | Who can write today | Who *should* write (target) | Where enforced |
|-------|---------------------|-----------------------------|----------------|
| `status` | subject trader (INSECURE), seed | referee(`submitted`) + admin(`approved/rejected`), service-role | DB (`:164-175`) |
| `reference_text` | subject trader (INSECURE), seed | referee only, via tokenised submission | DB |
| `verified_at` | subject trader (INSECURE), seed | admin approval, service-role | DB |
| `referee_email` | subject trader (create) | subject trader (create) — OK | DB |

## 3. Provider verification status (`profiles.provider_verification_status`)

| Role | View own | View others | Change (approve/reject) | Where enforced | Evidence |
|------|----------|-------------|--------------------------|----------------|----------|
| Anonymous | ❌ | ✅ only if `verified` | ❌ | DB | anon RLS `017_public_profiles.sql:48-54`; badge `ProviderSearchCard.tsx:44` |
| Registered customer | ✅ self (n/a) | ✅ verified providers | ❌ | DB | — |
| Registered trader (subject) | ✅ | — | ❌ | ALL | proxy gate `proxy.ts:425-430`; cannot self-approve (only admin route writes it) |
| Support admin (`manage_verifications`) | ✅ | ✅ | ✅ | ALL | route perm `api/admin/verifications/review/route.ts:29`; service `verification-service.ts:57-64` |
| Verification admin (`manage_verifications`) | ✅ | ✅ | ✅ | ALL | same |
| Super admin | ✅ | ✅ | ✅ | ALL | holds all perms (`admin-permissions.ts:35-43`) |
| `dev_admin` | ✅ | ✅ | ❌ | BE | lacks `manage_verifications` (`admin-permissions.ts:55-58`) — cannot review |

## 4. Routes & actions

| Route / action | Anonymous | Customer | Trader (subject) | Voucher | Support/Verif admin | Super admin | Where enforced |
|----------------|-----------|----------|------------------|---------|---------------------|-------------|----------------|
| `/dashboard/provider/verification/*references` | ❌ redirect login | ❌ role mismatch | ✅ (verification is gate-exempt) | ❌ | ❌ (not their dashboard) | ❌ | ALL — `proxy.ts:406-418` exempts `/verification`, role checks `:446-490` |
| Add reference (dialog → `sendReferenceRequest`) | ❌ | ❌ | ✅ (browser client + `_insert_own`) | ❌ | ❌ | ❌ | FE+DB — `ReferenceTracker.tsx:84`, RLS `:156-162` |
| Referee submit vouch | — | — | — | ❌ **no route** | — | — | — (NOT_IMPLEMENTED) |
| `/admin/verifications` (queue) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ALL — route perm map `admin-permissions.ts:90` (`manage_verifications`) |
| `POST /api/admin/verifications/review` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | BE — `route.ts:23-40` via `auditedAdminActionWithPermission(..., "manage_verifications", ...)` |
| Per-reference approve/reject/flag | — | — | — | — | ❌ **no action** | ❌ | — (NOT_IMPLEMENTED) |
| Delete/cancel own reference | ❌ | ❌ | ✅ (RLS, no UI button) | ❌ | ❌ | ❌ | DB — `_delete_own` (`:177-183`) |

## 5. Key RBAC findings

1. 🔴 **CRITICAL (V-01):** the subject trader has UPDATE on their own vouch rows including `status`/`reference_text`/`verified_at` — the one actor who must never be able to validate their own vouch can (`provider_references_update_own`, `20260316100001:164-175`). Restriction lives **only in DB** and it is the *wrong* restriction (grants, not denies).
2. **Voucher/referee is a phantom role** — it has zero permissions anywhere because no submission path exists (NOT_IMPLEMENTED).
3. **No admin reach into individual references** — admins act only on `profiles.provider_verification_status`; there is no policy or route giving any admin per-reference view/write.
4. **Admin review gating is correct** where it exists — `manage_verifications` is enforced at the API boundary (`route.ts:29`) and mapped for the page (`admin-permissions.ts:90`); `dev_admin` correctly cannot review.
5. **Recommended target:** move all non-`pending` reference writes off RLS-owner and onto a **service-role server route** that (a) accepts referee submissions only against a valid single-use token, and (b) accepts approve/reject/flag only from an admin holding `manage_verifications`. The subject trader retains create + cancel, nothing else.
