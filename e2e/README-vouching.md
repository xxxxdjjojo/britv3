# Vouching (provider references) E2E specs

Two Playwright specs cover the vouching flow end to end:

- `reference-vouching.spec.ts` — the **referee** journey (logged out): valid
  submission, single-use enforcement, expired, invalid, decline.
- `admin-reference-review.spec.ts` — the **admin** journey: the
  `/admin/verifications/[userId]` panel, verify/reject with a required reason,
  and the server-side authorization boundary on the review API.

## The seed-known-token approach

The referee surface authenticates purely on the single-use **raw token** in the
`/reference/<token>` URL. Only the token's **SHA-256 hash** is ever persisted
(`provider_references.invite_token_hash`) — the raw token exists only inside the
emailed link. A deterministic E2E therefore cannot read a real token; instead it
**mints a token it already knows** and writes the matching hash:

```ts
const token = "e2e-<random>";                 // known raw token, test-only
invite_token_hash = hashReferenceToken(token) // src/lib/reference-tokens.ts
```

The helper `e2e/fixtures/reference-seed.ts` does exactly this. It reuses the
app's own `hashReferenceToken`, so the stored hash is byte-for-byte what the
referee endpoints compute — no drift. Writes go through a **service-role**
Supabase client (bypasses RLS, exactly like the production invitation/referee
code paths).

- `seedReference(providerId, refereeEmail, { token, referenceType, status, expiresInDays, ... })`
  inserts one invitation row and returns `{ id, token }`.
  - `status: "sent"` + future expiry → a **valid** invite (referee can submit/decline).
  - `status: "sent"` + `expiresInDays: -1` → an **expired** invite.
  - `status: "submitted"` (+ `referenceText`, and for client refs `workDate`) →
    a row ready for **admin review**.
- Rows are tagged by a per-run marker in `referee_email`; `afterAll` calls
  `cleanupReferencesByEmail` to delete only what the run created.

To exercise the **used** (single-use) state, the spec submits a real invite
through the browser and then revisits the same token — no special seed needed.

## Required test users / data

- **Provider** (default `test-provider@britestate.test`): must exist as an auth
  user AND have a row in `service_provider_details` (`user_id` = the provider’s
  auth id). `provider_references.provider_id` references that user id. Override
  with `E2E_PROVIDER_EMAIL`.
- **Admin** (`test-admin@britestate.test`): `is_admin = true` with the
  `manage_verifications` permission. Authenticated via the standard
  `role: "admin"` fixture (`e2e/.auth/admin.json`, written by `auth.setup.ts`).

These are the same `@britestate.test` users the rest of the E2E suite assumes.

## Environment

The seed helper needs a service-role client:

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only; bypasses RLS) |
| `E2E_PROVIDER_EMAIL` (optional) | Override the seeded provider |

`playwright.config.ts` targets `E2E_BASE_URL` (default `http://localhost:3000`).
When it is a localhost URL, Playwright starts `pnpm dev` itself; when it points
at a remote/deployed target it will NOT start a server. The seed helper and the
auth setup both read `.env.local` / `.env` via `loadPlaywrightEnv`.

## Running

```bash
# Collect/parse only (no DB or app needed):
pnpm exec playwright test \
  e2e/reference-vouching.spec.ts e2e/admin-reference-review.spec.ts --list

# Full run (requires: migrations applied to the target DB, the test provider +
# admin users seeded, service-role env set, and the app running / a localhost
# target so Playwright can start it):
pnpm exec playwright test \
  e2e/reference-vouching.spec.ts e2e/admin-reference-review.spec.ts
```

> These specs need the vouching migrations
> (`supabase/migrations/20260712100001..3`) applied to the target database. If
> the target DB lacks the new columns/enum values, or service-role writes are
> blocked, the specs will fail at seed time — apply the schema and seed the
> users first.
