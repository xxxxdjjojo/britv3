# Vouching Remediation Plan — Post-Fix

**Branch:** `feat/vouching-system` · **Date:** 2026-07-12 (post-fix update)

Derived from the pre-fix findings (V-01…V-11). Complexity: **S** (< ½ day) · **M** (~1 day) · **L** (2–3 days) · **XL** (> 3 days). Owner type: **DB · Backend · Frontend · Admin · Email/Jobs · Product · QA**.

The vouching system was **built end-to-end** since the pre-fix pass. §1 (Done) records what shipped; §2 lists the genuinely-remaining work. Priorities/complexity are retained from the original plan.

---

## 1. DONE (built + unit/db-tested + reviewed)

> These are CONFIRMED in code and tests. They become LIVE only once the migrations are applied to the target DB (see R-A below) — until then they are UNTESTED-LIVE.

### R1 — INSECURE `provider_references` RLS forge → FIXED ✅ (P0)
- **Owner:** DB + Backend · **Complexity:** M
- **What shipped:** `20260712100002` DROPs trader insert/update/delete-own; keeps select-own; adds admin select+update (`is_admin`); BEFORE UPDATE trigger freezes `provider_id`/`referee_email`/`reference_type`. Trader writes now route through the service-role `/api/provider/references*` endpoints; referee writes through service-role token endpoints.
- **Proof:** `db-tests/provider-references-vouching.test.ts` — **37/37 pass** on real Postgres. Forge denied; select-own + admin access + unique constraints hold.

### R2 — Invitation tokens (single-use, expiring) → DONE ✅ (P1)
- **Owner:** DB + Backend · **Complexity:** M
- **What shipped:** `invite_token_hash` (sha256 hex, raw never stored), `invite_expires_at`, `invite_sent_at`, `invite_last_sent_at`, `invite_send_count` (`20260712100002:18-31`); `src/lib/reference-tokens.ts` (generate/hash/timing-safe-match/expiry, 19 unit tests). Single-use enforced by NULLing the hash on submit/decline + `.not(...is null)` serialization; uniqueness via `uq_provider_references_token_hash`.

### R3 — Referee submission surface + server route → DONE ✅ (P1)
- **Owner:** Frontend + Backend · **Complexity:** L
- **What shipped:** `/reference` in `PUBLIC_ROUTES`; `src/app/reference/[token]/page.tsx` (service-role resolve, robots noindex, no ids); `ReferenceSubmissionForm.tsx` + `ReferenceTokenState.tsx` (a11y); `POST /api/references/[token]/submit` (200/409/410/404/400, 5/hr/IP fail-open, constant-time hash compare, generic invalid) + `/decline`; `reference-submission-service.ts` (resolve/submit/decline). Self-vouch + duplicate guarded (in invitation service). Client work_date required + non-future.

### R4 — Reference-request email + Inngest function → DONE ✅ (P1)
- **Owner:** Email/Jobs · **Complexity:** M
- **What shipped:** `src/emails/reference-request.tsx` (expiry + reminder variants) + `sendReferenceInvitation` (Resend + `email_logs`); `src/inngest/functions/reference-request-email.ts` handling `provider/reference.requested` + `.resend-requested` (generates token, hashes to DB via `markSentReference`, raw only in URL, retries:3); registered in `src/app/api/inngest/route.ts`.

### R5 — Decline / cancel / resend / expire lifecycle → DONE ✅ (P1)
- **Owner:** Backend + Frontend + Email/Jobs · **Complexity:** L
- **What shipped:** enum extended to 9 statuses (`20260712100001`); resend (`/[id]/resend`, cooldown + max-sends) and cancel (`/[id]/cancel` → `revoked`) wired into `ReferenceTracker.tsx` (fixes V-09); referee decline; lazy expiry on resolve + expiry-sweep index. **Remaining:** a background Inngest expiry sweep (see R-D).

### R6 — Per-reference admin review + reviewer/audit fields → DONE ✅ (P1)
- **Owner:** Admin + Backend + DB · **Complexity:** L
- **What shipped:** review columns (`reviewed_by/at`, `review_reason`); `reviewReference` (verify/reject/flag; reason req; DB-serialized; submitted|flagged only); `POST /api/admin/references/[id]/review` (`manage_verifications`, UUID-guard, error mapping, logs `metadata:{decision,reason}` — closes V-07); admin trader-detail page with `AdminReferencesPanel` (full referee email for fraud detection).

### R7 — Configurable vouch-rules gate (default OFF) → DONE ✅ (P1)
- **Owner:** Product + Backend · **Complexity:** L
- **What shipped:** `verification_vouch_rules` singleton (required_peer/client=3, client_recency_days=90, invite_expiry_days=30, resend_cooldown_hours=24, `gate_enabled=FALSE`); `vouch-rules-service.ts` (`getVouchRules`/`countValidVouches`/`evaluateVouchGate`); `VouchCountsBanner` + gate-aware admin approve (confirm only when ON && unmet); `VouchRulesEditor` + audited `PUT /api/admin/vouch-rules`. Gate OFF preserves the existing direct-approve flow.

### R8 — DB uniqueness on (provider, email, type) → DONE ✅ (P2)
- **Owner:** DB · **Complexity:** S
- **What shipped:** `uq_provider_references_active_invite` partial unique index on `(provider_id, lower(referee_email), reference_type)` for active statuses; service maps the unique violation to a friendly 409.

### R9 — Fix latent provider-id derivation → DONE ✅ (P2)
- **Owner:** Frontend · **Complexity:** S
- **What shipped:** peer/client reference pages now use `const providerId = user.id;` explicitly (documented as `service_provider_details.user_id === auth uid`); the `.select("id") ?? user.id` fallback removed.

### R13 — Audit metadata for admin review → DONE ✅ (P2)
- **Owner:** Backend · **Complexity:** S
- **What shipped:** the review route writes `admin_audit_log` with `metadata:{decision,reason}` (`review/route.ts:60-74`). **Note:** this intentionally double-logs (the wrapper's base entry + the explicit metadata entry) — a metadata-bearing record is more valuable than the bare one, and the metadata log is best-effort so a log failure never 500s an already-succeeded review. **Remaining:** per-transition audit events for non-admin lifecycle changes (referee submit/decline, trader cancel) — see R-E.

---

## 2. REMAINING

### R-A — Apply migrations to the target DB + ledger reconcile 🔴 (P0 for launch)
- **Owner:** DB/Ops · **Complexity:** S · **Dependencies:** none (code already merged-ready)
- **Files/systems:** `20260712100001..3` applied manually per `supabase/migrations/README.md` (auto-apply retired); reconcile the migration ledger.
- **Acceptance:** the three migrations are present on the target DB; `pnpm check:migrations` still ✓; RLS/trigger/indexes verified live. **This unblocks everything below.**

### R-B — Seed a provider + admin test user on the target DB (P0 for verify)
- **Owner:** Ops/QA · **Complexity:** S · **Dependencies:** R-A
- **Acceptance:** a provider test user with `service_provider_details` and an admin with `manage_verifications` exist so the app/e2e/browser flow can be exercised.

### R-C — Run the live e2e specs + browser verification (P0 for verify)
- **Owner:** QA · **Complexity:** M · **Dependencies:** R-A, R-B
- **Files/systems:** `e2e/reference-vouching.spec.ts`, `e2e/admin-reference-review.spec.ts`, `e2e/fixtures/reference-seed.ts`, `e2e/README-vouching.md` (specs exist + reviewed).
- **Acceptance:** trader→email→referee→admin journey runs green end-to-end; the UNTESTED-LIVE flows move to WORKING (live-verified).

### R-D — VerificationQueueClient silent-failure follow-up (P2)
- **Owner:** Frontend · **Complexity:** S · **Dependencies:** none
- **What:** `src/components/admin/VerificationQueueClient.tsx` swallows `!res.ok` silently on the provider quick-approve/reject (calls `router.refresh()` regardless), so a failed approve looks like a success. Pre-existing, out of the vouching build's scope — surface the error to the admin.
- **Acceptance:** a failed quick-approve/reject shows an error instead of silently refreshing.

### R-E — Background expiry sweep + per-transition audit events (P2/P3)
- **Owner:** Backend/Jobs · **Complexity:** M · **Dependencies:** R-A
- **What:** expiry is currently lazy-on-resolve only; add an Inngest sweep that transitions outstanding `pending`/`sent` past `invite_expires_at` to `expired` (index `idx_provider_references_expiry` already supports it). Emit per-transition audit events for referee/trader lifecycle changes (R13 covered admin review only).
- **Acceptance:** stale invites auto-expire without a referee visit; every state change is auditable.

### R10 — Self-vouch / abuse heuristics (P3)
- **Owner:** Backend · **Complexity:** M · **Dependencies:** R-A, R6
- **Acceptance:** submissions from the provider's own contact details or clustered/suspicious patterns auto-`flagged` for admin. (Basic self-vouch-by-email is already blocked at invite time; this is deeper heuristics.) Optional: disposable-email domain filtering on invite.

### R11 — Recent-customer recency: separate `peer_recency` field (P3)
- **Owner:** Backend + Product · **Complexity:** M · **Dependencies:** R7
- **What:** `client_recency_days` is enforced via `work_date`; if peer vouches ever need their own recency window, add a separate `peer_recency` config field (optional).
- **Acceptance:** peer recency configurable independently if the product wants it.

### R12 — Referee identity binding / account linking (P3)
- **Owner:** Backend + Frontend · **Complexity:** L · **Dependencies:** R3
- **Acceptance:** invited existing users can link the vouch to their account; the current guest path stays for new users.

### R14 — Fraud/anomaly signals + alerting (P3)
- **Owner:** Ops/Backend · **Complexity:** M · **Dependencies:** R10, R-E
- **Acceptance:** spikes in flagged/anomalous vouches raise a Sentry/ops alert.

---

## 3. Product-Policy Decisions (still open)

| # | Decision | Why it matters |
|---|----------|----------------|
| P-1 | Turn the gate ON, and at what counts (defaults: 3 peer + 3 client) | `verification_vouch_rules.gate_enabled` is FALSE; enabling changes the approve flow |
| P-2 | Whether existing seed/legacy `verified` references are grandfathered or re-validated | Data-migration impact once the gate is ON |
| P-3 | Whether a referee must have an account or can vouch as a guest | Drives R12 scope (guest path currently shipped) |
| P-4 | Whether references become a hard prerequisite when the gate is ON | Affects existing verified providers |

## 4. Sequencing (remaining)

```
R-A (P0) ─► R-B (P0) ─► R-C (P0, live verify)
R-D (P2, independent)
R-E (P2) ─► R14
R10, R11, R12 (P3, post-launch)
```

**Ship gate:** the code is complete and the DB security contract is proven (37/37). The launch-blocking work is **R-A → R-B → R-C** (apply migrations, seed users, run live e2e). Everything else is incremental hardening.
