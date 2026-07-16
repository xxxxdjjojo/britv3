# Didit trader identity verification — design

Status: **design complete** (2026-07-16). Console setup done via the Didit MCP.
Next: implementation plan → build.

## Scope (confirmed with user)

- **Who:** Traders / service providers ONLY. Not regular users, not estate agents.
- **Why:** Confirm the trader is 18+ AND a real person. (Company registration is
  already enforced separately via Companies House — `companies-house-service.ts`,
  registered ≥2 years + active — unchanged.)
- **Didit's job:** Replace the trader's manual "Identity Verification" step
  (`id_check`) — today a passport/licence upload with admin review — with a
  Didit hosted verification session (document OCR + passive liveness + face
  match). The document's DOB proves 18+. One session covers identity + age.
- **Unchanged:** insurance, qualifications, client/peer references steps; DBS
  handling; Companies House gate.

## Console setup (DONE — created 2026-07-16 via Didit MCP)

| Thing | Value |
|---|---|
| Organization | galeriminuit (`87882069-0b52-467c-87c8-7d3cd3fe699b`) |
| Application | "My Application" (`8c9d74a6-170a-457d-b107-b3eaa3519cc7`) — production |
| Workflow | **Trader ID Verification (18+)** — `3eb02ad1-491f-40b0-99d3-4d233d3561bf`, published. Features: OCR → LIVENESS (passive) → FACE_MATCH. |
| Webhook destination | `cea05b4f-15cb-405c-8c13-f91dd32eb11b` → `https://www.truedeed.co.uk/api/webhooks/didit`, v3 payload, events `status.updated` + `data.updated`, enabled |

`.env.local` state:
- `KYC_API_KEY` — set (TEMP value; user will rotate).
- `DIDIT_WORKFLOW_ID` — set to the workflow above.
- `DIDIT_WEBHOOK_SECRET` — **placeholder**. The MCP redacts signing secrets by
  design; the user must copy it from Didit console → Settings → Webhooks and
  paste it in (and into Vercel env for production).

## Didit API reference

- Create session: `POST https://verification.didit.me/v3/session/` with header
  `x-api-key: <KYC_API_KEY>`, body `{"workflow_id": "...", "vendor_data": "<userId>", "callback": "<returnUrl>"}`.
  Returns `session_id`, `url` (hosted redirect), `status`.
- Decision: `GET /v3/session/{session_id}/decision/` → overall `status` +
  `id_verifications[]` (includes DOB / `age`), `liveness_checks[]`, `face_matches[]`.
- Webhook: HMAC-SHA256 of the RAW body with the webhook secret, sent in
  `X-Signature` (hex) + `X-Timestamp` (unix seconds; reject if >5 min skew).
  Payload carries `session_id`, `status`, `vendor_data`.
- MCP auth (OAuth) is separate from runtime auth (`x-api-key`) — runtime never
  touches the MCP.

## Key design decision — where `id_check` status lives

`getVerificationSteps()` (`src/services/provider/provider-verification-service.ts`)
currently derives `id_check` from `provider_documents`. **Finding (2026-07-16):**
that query selects `provider_id, status, rejection_reason`, but the live table
(`002_marketplace.sql`, never altered since) has `user_id, verification_status,
reviewer_notes` — the recurring column-drift bug class. The query errors →
caught → `id_check` reads "not_started" regardless. The manual upload path is
therefore already display-broken; there is nothing to preserve.

**Decision:** `id_check` derives from `profiles.kyc_status` (+ `kyc_provider_ref`),
the columns added by `20260619120002_kyc_scaffold.sql`, and stops reading
`provider_documents` entirely. Insurance/qualifications keep their existing
derivation (fixing their drift is out of scope — noted, not touched).

Status mapping (`profiles.kyc_status` → step status):

| kyc_status | step status |
|---|---|
| `not_started` (or NULL) | `not_started` |
| `pending` | `submitted` ("Under review — no action needed") |
| `verified` | `approved` |
| `failed` | `rejected` |

## Components

### 1. `DiditKycAdapter` (new — `src/services/verification/adapters/didit-kyc-adapter.ts`)

Server-only. `implements KycProvider`:
- `createSession({userId, returnUrl})` → POST `/v3/session/` with
  `workflow_id: env.DIDIT_WORKFLOW_ID`, `vendor_data: userId`,
  `callback: returnUrl`. Returns `{providerRef: session_id, status: "pending",
  redirectUrl: url}`. Throws typed errors on non-2xx (no silent fallback).
- `getKycProvider()` in `kyc-stub-adapter.ts` returns it when
  `env.KYC_PROVIDER === "didit"` (stub remains default).

### 2. Session-start endpoint (new — `POST /api/kyc/session`)

Authenticated route (provider role). Flow:
1. Reject if `profiles.kyc_status` is already `verified` (idempotent guard).
2. `getKycProvider().createSession({userId, returnUrl: /dashboard/provider/verification?kyc=return})`.
3. Persist `profiles.kyc_status = 'pending'`, `kyc_provider_ref = session_id`.
4. Return `{redirectUrl}`; client navigates to the Didit hosted page.

With `KYC_PROVIDER=stub` the stub returns `redirectUrl: null` → route responds
409 "verification not available" and the UI keeps the legacy copy — safe dark
launch until the env flips.

### 3. Webhook route (new — `POST /api/webhooks/didit`)

Follows the house pattern (see `api/webhooks/resend/route.ts`):
- `export const dynamic = "force-dynamic"`; read RAW body first; 500 if
  `DIDIT_WEBHOOK_SECRET` unset; verify HMAC + timestamp freshness BEFORE any
  parse/DB access; 401 on bad signature.
- Resolve user: `vendor_data` (userId) primary, `kyc_provider_ref = session_id`
  lookup as fallback; ignore (200) sessions we can't match.
- Map Didit session status → `profiles.kyc_status` via admin client:
  `Approved → verified`; `Declined → failed`; `In Review → pending`;
  `Abandoned`/`Expired`/`KYC Expired` → `failed` (user can restart);
  other/unknown → ack 200, no write.
- Only ever move status forward from `pending` for the matching
  `kyc_provider_ref` (stale/replayed events for old sessions are ignored) —
  this is also the idempotency story: writes are absolute-state, not increments.
- 200 on handled + unknown event types; 500 on DB failure (Didit retries).
- `/api/*` is exempt from the proxy login redirect — no proxy change needed.

### 4. Trader stepper UI

- `VERIFICATION_STEPS.id_check` copy: "Verify your identity with a quick
  document + selfie check. Takes about 2 minutes." `document_types` removed
  from the step (it no longer reads provider_documents).
- `VerificationStepper` card for `id_check` calls `POST /api/kyc/session` and
  redirects to the returned URL (small client component for that card's action;
  other cards keep their `Link`s). Rejected state's "Re-apply" does the same
  (creates a fresh session).
- Credentials page (`verification/credentials`): drop the "Identity Document"
  upload row (`identity_proof`); DBS upload stays.
- On return (`?kyc=return`): the page server-side reconciles by fetching
  `GET /v3/session/{kyc_provider_ref}/decision/` when status is `pending` —
  covers webhook lag/misses. Render whatever `profiles.kyc_status` then says.

### 5. Env & config

- `src/env.ts`: add `DIDIT_WORKFLOW_ID` + `DIDIT_WEBHOOK_SECRET` (server,
  optional strings — required-at-use inside the adapter/webhook when
  `KYC_PROVIDER=didit`).
- `.env.example`: document the three Didit vars.
- No new migration: `kyc_scaffold` columns already exist (verify applied on
  prod during implementation).

### 6. Rollout

1. Land code with `KYC_PROVIDER` unset (stub) — everything dark.
2. User pastes real `DIDIT_WEBHOOK_SECRET` (console) into `.env.local` + Vercel.
3. Set `KYC_PROVIDER=didit` in Vercel → deploy → live.
4. Rollback = unset `KYC_PROVIDER`.

## Security

- HMAC verify against raw body + timestamp freshness before anything else.
- Admin (service-role) client only inside the webhook/route server code.
- No document images/PII stored on our side — Didit hosts the session; we keep
  only `kyc_status` + `kyc_provider_ref`.
- Session creation rate-limited per user (existing rate-limit helper) to stop
  cost-burning session spam.
- Never log the payload body or api key; log session_id + outcome only.

## Testing (TDD)

- `didit-kyc-adapter.test.ts` — fetch mocked: happy path, non-2xx, missing env.
- Webhook route tests — valid/invalid/missing signature, stale timestamp,
  status mapping (each Didit status), unmatched session ack, DB failure → 500,
  replay of an old session's event is ignored.
- `provider-verification-service.test.ts` — id_check derivation from
  `profiles.kyc_status` (all four mappings).
- Stepper component test — id_check card triggers session start + redirect;
  existing cards' link behaviour unchanged.
- Full `src/__tests__` guard layer + `pnpm build` + `pnpm lint` before PR.

## Out of scope

- AML screening (workflow can gain an AML node later — pricier per session).
- Fixing insurance/qualifications `provider_documents` column drift (separate bug).
- Estate-agent or user KYC; KYB (Companies House already covers the company).
- Admin review UI changes (Didit console is the review surface for KYC).

## Open items (carried into the implementation plan)

1. **User action:** copy the webhook signing secret from the Didit console into
   `.env.local` + Vercel (`DIDIT_WEBHOOK_SECRET`).
2. Verify on prod that `profiles.kyc_status`/`kyc_provider_ref` exist
   (kyc_scaffold migration applied) — prod read was classifier-blocked this
   session.
3. Rotate `KYC_API_KEY` (user said TEMP).
