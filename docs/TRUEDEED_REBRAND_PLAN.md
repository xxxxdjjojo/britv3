# TrueDeed Rebrand Plan

Audit baseline: 1,322 findings across 270 tracked files on 2026-06-19.

## Phase 1: Prevent Regression

- Keep `pnpm check:brand` in CI.
- Require exact source-path allowlist entries for any temporary exception.
- Remove allowlist entries immediately after a file is rebranded.

## Phase 2: User-Visible Source

Priority order:

1. Public legal pages: 253 findings across 20 files.
2. API/PDF/GDPR export surfaces: 16 findings across 7 files.
3. Shared components and navigation: 16 findings across 14 component files plus `src/config/navigation.ts`.
4. SEO/json-ld helpers: 4 findings across 4 files.

Verification:

- Run affected unit tests.
- Run `pnpm check:brand`.
- Spot-check rendered copy for changed public pages.

## Phase 3: Operational Backlog

- Replace legacy domains in Supabase seed/demo users where tests permit.
- Rebrand script output in Stripe setup and mobility ingest scripts.
- Fix or regenerate `src/lib/push/push-notifications.test.ts` so it is valid UTF-8 or intentionally moved to a known binary fixture.

## Phase 4: Historical Material

Historical docs and planning files account for 792 findings across 152 files. Keep them allowlisted unless the team chooses to rewrite archive context.

