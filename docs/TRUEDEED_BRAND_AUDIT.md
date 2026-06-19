# TrueDeed Brand Audit

Audit date: 2026-06-19.

Command basis: the scanner in `scripts/check-legacy-brand-references.ts` over `git ls-files`, without the allowlist applied. Exclusions are dependency, build, test-report, cache, and known binary paths.

## Current Counts

| Area | Findings | Files |
| --- | ---: | ---: |
| All tracked scanned paths | 1,322 | 270 |
| `docs/` and `.planning/` | 792 | 152 |
| `src/app/` | 273 | 30 |
| `src/components/` | 16 | 14 |
| `src/lib/` | 35 | 12 |
| `src/inngest/` | 16 | 9 |
| `src/services/` | 3 | 3 |
| `scripts/` | 26 | 3 |
| `supabase/` | 19 | 4 |
| Tests and E2E | 50 | 27 |

Finding types:

| Type | Count |
| --- | ---: |
| Content | 1,318 |
| Filename | 3 |
| Unknown binary | 1 |

## High-Risk Areas

- Public legal pages: 253 findings across 20 files. These are user-visible and should be rebranded before launch/legal sign-off.
- API and generated documents: 16 findings across 7 API files, mainly exported PDF or GDPR/legal copy.
- Current source backlog: exact paths are allowlisted, not broad `src/**`, so new source files remain protected.
- Unknown binary: `src/lib/push/push-notifications.test.ts` is explicitly allowlisted until its encoding is fixed or confirmed.

## Low-Risk Areas

- Historical docs and planning files dominate the count. They are intentionally allowlisted as archived context.
- Test fixtures and demo seed data are allowlisted as migration backlog, not accepted product copy.

## Gate

`pnpm check:brand` must pass in CI. The gate catches new unallowlisted `Britestate` content, filenames, and unknown binary files.

