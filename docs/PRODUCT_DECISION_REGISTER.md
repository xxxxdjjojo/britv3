# Product Decision Register — TrueDeed (britv3)

> Log of every source-of-truth conflict the audit surfaces, the resolution
> applied (or pending), and the rationale. Append-only. New entries at the
> bottom.
>
> **Source-of-truth priority** (per master prompt):
> 1. Approved product decisions in the prompt
> 2. Approved PRD (`docs/brit estate prd 2026.txt` + `docs/epic*.txt`)
> 3. Current Google Stitch project
> 4. Actual working database & service contracts
> 5. Existing application architecture & conventions
> 6. Current running behaviour
> 7. Historic scaffolding documents
> 8. Assumptions (clearly marked)

---

## PDR-001 — App location: repo root vs `britv3.0/` subdirectory

- **Conflict:** Two `CLAUDE.md` files exist (canonical repo vs the older ad-hoc
  clones at `/Users/jojominime/britv3` and `Documents/Claude/britv3`). One says
  "app lives at repo root"; the other says "app lives in `britv3.0/`".
- **Resolution:** **App at repo root.** The canonical repo's own `CLAUDE.md`
  is explicit: *"`britv3` is the single canonical working copy. The dev server
  and any deploy must run from `britv3`."* The `britv3.0/` directory in the
  canonical repo contains only 3 stray files (`britv3.0/src/types/agent.ts`,
  `seller.ts`, one gstack baseline) and is excluded from `tsconfig.json`. It is
  a vestigial stub from a prior reorg.
- **Rationale:** Level-5 (existing architecture) > Level-7 (historic docs). The
  `predev` hook (`scripts/dev-guard.mjs`) actively enforces this.
- **Action:** ignore `britv3.0/` in all work. Update the stale `CLAUDE.md`
  files in the ad-hoc clones (or, better, delete those clones — see PDR-003).

## PDR-002 — Next.js version drift in `CLAUDE.md`

- **Conflict:** `CLAUDE.md` claims "Next.js 16.2.1"; `package.json:74` declares
  **16.2.9**.
- **Resolution:** Trust the lockfile/package manifest (Level 5) over the
  doc (Level 7). Effective version is **16.2.9**.
- **Action:** patch `CLAUDE.md` to `16.2.9` in a follow-up docs PR.

## PDR-003 — Three ad-hoc clones of the same repo

- **Conflict:** `/Users/jojominime/britv3`, `Documents/Claude/britv3`, and
  `Documents/britv3main/britv3` are all `git clone`s of
  `git@github.com:xxxxdjjojo/britv3.git`, with conflicting state. The canonical
  repo's `CLAUDE.md` explicitly bans this pattern: *"Extra working copies must
  be git worktrees of britv3, not separate git clones."*
- **Resolution:** `Documents/britv3main/britv3` is the canonical copy (newest
  commit, has the dev-guard). The other two are stale and should be removed or
  converted to worktrees.
- **Action (pending founder approval):** archive `~/britv3` and
  `Documents/Claude/britv3` (or delete), and use `git worktree add` for
  parallel branches going forward. **Deletion is destructive and requires
  explicit founder sign-off.**

## PDR-004 — Two email services with divergent failure behaviour

- **Conflict:** `src/services/email/email-service.ts` (throws on missing key)
  and `src/services/notifications/email-service.ts` (silently no-ops on missing
  key) both wrap Resend and both are imported by app code. This is the
  duplicate-implementation pattern the master prompt explicitly bans.
- **Resolution (proposed, not yet applied):** canonical path =
  `src/services/email/email-service.ts` (it has the full template coverage).
  `notifications/email-service.ts` should be folded in or deleted. **Wait for
  Gate A approval before touching.**
- **Rationale:** Level-1 (master prompt hard rule) > Level-5 (existing code).

## PDR-005 — `Get a Quote` vs `Post a Job` routing

- **Conflict:** Mega-menu `Get Quotes` CTA navigates to
  `/dashboard/rfqs/create` (auth-gated), but the master prompt Workstream 1.A
  states that *"Post a job" and "Get a quote" are the same core journey… Both
  CTAs must open the approved Post a New Job screen immediately. Do not require
  sign-in before the user begins.* The existing `/post-a-job` route is public
  and self-adapts to auth state.
- **Resolution (pending Gate A approval):** both CTAs should resolve to
  `/post-a-job` with the deferred-auth flow described in Workstream 1.A. The
  `/dashboard/rfqs/create` route stays for authenticated users who skip the
  wizard.
- **Rationale:** Level-1 (approved decision in prompt) > Level-6 (current
  behaviour).

## PDR-006 — `ROLE_PRIMARY_CTA` dead links (`/listings/new` vs `/listings/create`)

- **Conflict:** The Sidebar "primary CTA" for seller, landlord, and agent
  (`src/config/navigation.ts:599-601`) all point to `…/listings/new`, which
  does not exist. Real routes are `…/listings/create` (seller/agent) and
  `…/properties/add` (landlord). This is a clear bug, not a product decision.
- **Resolution:** **P0 fix** — update the three hrefs to the real routes.
- **Rationale:** Level-4 (working service contract — the create routes are the
  ones wired to the listing service).

## PDR-007 — `mortgage_broker` role outside `VALID_ROLES`

- **Conflict:** The dynamic `/dashboard/[role]/layout.tsx` `VALID_ROLES` array
  contains 6 roles and omits `mortgage_broker`. The broker dashboard lives in
  a parallel `/dashboard/broker/*` tree, so two role-routing patterns coexist.
- **Resolution (proposed):** either (a) add `mortgage_broker` to `VALID_ROLES`
  and migrate the broker tree under `/dashboard/[role]`, or (b) document the
  split as intentional (broker has unique layout needs). **Needs product
  input.**
- **Rationale:** ambiguous until product confirms intent.

## PDR-008 — Sold-price vs listing conflation

- **Conflict (resolved):** the Gate A data audit found no surface that presents
  HMLR sold-price data as active listing data. The only soft conflation is the
  `last_sold_date` field on listing cards. Source attribution is correct
  (`"HM Land Registry Price Paid Data"`). **No action.**
- **Rationale:** Level-4 verified.

## PDR-009 — `RESEND_FROM_NAME` brand drift

- **Conflict:** `.env.example` ships `RESEND_FROM_NAME=Britestate`, but the
  actual FROM header resolves through `brandConfig.fromEmail =
  "hello@truedeed.co.uk"` with `displayName = "TrueDeed"`. Cosmetic, but
  confusing for new operators.
- **Resolution:** update `.env.example` to `RESEND_FROM_NAME=TrueDeed`.
- **Rationale:** Level-2 (brand) > Level-7 (template).

## PDR-010 — Stitch MCP API key committed in public repo

- **Conflict (NEW — security):** `.mcp.json` at the repo root contains a Stitch
  (Google) API key:
  ```
  "X-Goog-Api-Key": "AQ.Ab8RN6L7qyBwFTuJ_tY1jFRhn52C7qfk0-Jzb-UytQH6wXABDQ"
  ```
  The repo `xxxxdjjojo/britv3` is **public** on GitHub. Anyone can read the
  key. This violates the master prompt hard rule: *"Do not expose private
  information."*
- **Resolution (pending founder approval — destructive):**
  1. Rotate the key in Google Cloud / Stitch console.
  2. Add `.mcp.json` to `.gitignore` (or move the key to an env var).
  3. `git filter-repo` or GitHub secret-scanning to purge history.
- **Rationale:** Level-1 (security hard rule) supersedes everything.

## PDR-011 — Master prompt template variables unresolved

- **Conflict:** the master prompt has several `{{...}}` placeholders that were
  never filled in: `{{REPOSITORY_OR_WORKSPACE}}`, `{{APP_URL}}`,
  `{{PRD_AND_DOC_PATHS}}`, `{{DATABASE_DETAILS}}`, `{{STITCH_BUNDLE_PATH}}`,
  `{{COMMANDS_IF_KNOWN}}`.
- **Resolution:** resolved by audit:
  - Repo: `/Users/jojominime/Documents/britv3main/britv3`
  - App URL (local): `http://localhost:3004` (per `.env.example`)
  - PRD/docs: `docs/brit estate prd 2026.txt`, `docs/epic*.txt`, `.planning/`
  - DB: Supabase (project URL in `.env.example`; ~120 migrations, ~130 tables)
  - Stitch bundle: no existing bundle; `.mcp.json` provides live MCP access
  - Commands: `pnpm dev / build / lint / test / test:e2e / typecheck` (from
    `package.json`)
- **Action:** treat the above as canonical for all downstream workstreams.

## PDR-012 — Filter-reference screenshots not accessible

- **Conflict:** the master prompt references
  `/mnt/data/Screenshot 2026-06-18 at 17.20.41.png` and `17.20.49.png` as
  rental-filter references. These are Claude.ai analysis-environment paths and
  **are not present on this machine**.
- **Resolution:** the rental-filter work (Workstream 5.B) cannot use those
  exact images. Either (a) founder re-uploads them to the repo, or (b) we
  proceed using the approved Stitch screens + the existing search UI as the
  filter reference.
- **Action:** flag to founder. **Blocks precise Workstream 5.B visual matching
  until resolved.**

---

*Next entries appended as workstreams surface new conflicts.*
