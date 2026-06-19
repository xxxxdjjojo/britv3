# TrueDeed Brand Requirements Traceability

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Add a scanner command | `check:brand` in `package.json` runs `scripts/check-legacy-brand-references.ts` | `pnpm check:brand` |
| Run in CI | `.github/workflows/app-ci.yml` has `Check brand references` | CI executes `pnpm check:brand` |
| Search source-controlled files | Scanner enumerates `git ls-files` | Unit test injects tracked files; CLI uses Git |
| Search text content | Scanner decodes UTF-8 text and scans each line | Scanner unit test detects `src/page.tsx:2` |
| Search filenames | Scanner checks tracked file paths before content scanning | Scanner unit test detects `src/BritestateBadge.tsx:1` |
| Print exact `file:line` | `formatFindings` emits `path:line message` | Scanner unit assertions check formatted output |
| Ignore dependencies/build/reports/caches | Scanner excludes `node_modules`, build outputs, coverage, Playwright/test reports, caches, and `.gstack/qa-reports` | Baseline reports 351 skipped files |
| Support explicit allowlist | Scanner reads `docs/TRUEDEED_LEGACY_BRAND_ALLOWLIST.md` plus CLI `--allowlist` | Scanner unit test verifies allowlisted path has no findings |
| Do not silently ignore unknown binary files | Unknown non-UTF-8 tracked files are findings unless allowlisted | Scanner unit test verifies an unknown binary finding |
| Document current audit counts | `docs/TRUEDEED_BRAND_AUDIT.md` and allowlist doc include the 2026-06-19 counts | Re-run no-allowlist scanner to refresh |

Open caveat: the allowlist is path-pattern based, not line-fingerprint based. It prevents new unallowlisted files and filenames, but a new legacy string added to an already allowlisted file will not fail until that file leaves the allowlist.

