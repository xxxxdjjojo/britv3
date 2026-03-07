---
phase: 07-production-readiness
plan: 08
subsystem: security
tags: [rls, database-security, dependabot, owasp-zap, vulnerability-scanning]
dependency_graph:
  requires: ["07-02", "07-03"]
  provides: ["RLS audit tooling", "dependency vulnerability scanning", "OWASP ZAP baseline scan"]
  affects: ["all-tables", "github-dependabot", "ci-security"]
tech_stack:
  added: []
  patterns:
    - "pg_catalog metadata queries for RLS status verification"
    - "Service-role Supabase client for database audit (bypasses RLS)"
    - "CI-safe test skipping pattern when DB credentials unavailable"
    - "Dependabot group updates (patch/minor) to reduce PR noise"
    - "ZAP Docker-based scanning with exit-code-driven CI integration"
key_files:
  created:
    - britv3.0/tests/security/rls-audit.sql
    - britv3.0/tests/security/rls-audit.test.ts
    - britv3.0/docs/rls-audit-report.md
    - britv3.0/.github/dependabot.yml
    - britv3.0/tests/security/zap-baseline.sh
    - britv3.0/tests/security/zap-config.conf
  modified: []
decisions:
  - "RLS audit test uses exec_sql RPC for pg_catalog access; gracefully degrades if RPC unavailable"
  - "Dependabot groups patch/minor updates to reduce noise while keeping security alerts immediate"
  - "ZAP config suppresses 3 known false positives: X-Content-Type-Options (Next.js sets it), nonce-based CSP (ZAP cannot parse nonces)"
  - "INTENTIONALLY_POLICY_FREE_TABLES array in test allows documenting service-role-only tables without false failures"
metrics:
  duration: 12 min
  completed_date: "2026-03-07"
  tasks_completed: 2
  files_created: 6
---

# Phase 7 Plan 8: Security Hardening (RLS Audit + Dependabot + ZAP) Summary

**One-liner:** RLS audit SQL queries + automated test verifying all public tables have policies, Dependabot weekly npm/actions scanning, and OWASP ZAP Docker-based baseline scan script with known false positive suppression.

## Tasks Completed

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | RLS policy audit SQL queries, test, and report | a27b582 | rls-audit.sql, rls-audit.test.ts, rls-audit-report.md |
| 2 | Dependabot config and OWASP ZAP baseline scan | 7285a8e | dependabot.yml, zap-baseline.sh, zap-config.conf |

## What Was Built

### Task 1: RLS Audit

**`tests/security/rls-audit.sql`** — 5 diagnostic queries:
1. Tables without RLS (expected: empty result = pass)
2. All policies per table (for manual review)
3. RLS-enabled tables with no policies (security hole check)
4. Coverage summary (tablename, rls_status, policy_count)
5. Explicit check for 15 sensitive tables (profiles, messages, bookings, etc.)

**`tests/security/rls-audit.test.ts`** — Vitest integration test:
- Connects via service role key to access pg_catalog
- Tests: all tables have RLS, all RLS tables have policies, 15 sensitive tables explicitly verified
- Produces formatted console report listing every table's RLS status
- Gracefully skips (not fails) when DB credentials unavailable — CI-safe

**`docs/rls-audit-report.md`** — Audit report template:
- Documents all 25 expected tables across 6 domains (Users, Properties, Communication, Marketplace, Landlord, Admin)
- Per-table expected RLS status and policy coverage description
- Audit history table for ongoing re-audits

### Task 2: Dependabot + ZAP

**`.github/dependabot.yml`**:
- npm ecosystem: `/britv3.0` directory, weekly Monday, max 10 PRs, groups patch/minor
- github-actions ecosystem: repo root, weekly Monday, max 5 PRs
- Labels: `dependencies`, `security` for npm; `github-actions` for workflow updates

**`tests/security/zap-baseline.sh`**:
- Accepts staging URL as argument: `./zap-baseline.sh https://staging.britestate.com`
- Runs ZAP via Docker (no local ZAP install required)
- Outputs HTML + MD + JSON reports to `tests/security/zap-report/`
- Exits with ZAP's code (0=pass, 1=warn, 2=fail) for CI integration
- Pre-flight checks: Docker installed, Docker daemon running

**`tests/security/zap-config.conf`**:
- Rule 10021: Suppress X-Content-Type-Options (Next.js sets this header)
- Rule 10038: Suppress CSP header missing (nonce-based CSP set in middleware.ts)
- Rule 10055: Suppress CSP scanner nonce warnings (per-request crypto nonces are secure)

## Deviations from Plan

None - plan executed exactly as written, with one addition:

**[Rule 2 - Missing critical functionality] Added zap-config.conf as separate file**
- Found during: Task 2
- Issue: Plan mentioned `-c zap-config.conf` but didn't explicitly call for creating the conf as a named artifact
- Fix: Created `tests/security/zap-config.conf` as a standalone documented file (rather than inline in the script)
- Files modified: tests/security/zap-config.conf (created)
- Commit: 7285a8e

## Self-Check

Files verified:
- [x] britv3.0/tests/security/rls-audit.sql -- EXISTS
- [x] britv3.0/tests/security/rls-audit.test.ts -- EXISTS
- [x] britv3.0/docs/rls-audit-report.md -- EXISTS
- [x] britv3.0/.github/dependabot.yml -- EXISTS
- [x] britv3.0/tests/security/zap-baseline.sh -- EXISTS (chmod +x)
- [x] britv3.0/tests/security/zap-config.conf -- EXISTS

Commits verified:
- [x] a27b582 -- feat(07-08): RLS policy audit SQL queries, automated test, and audit report
- [x] 7285a8e -- feat(07-08): Dependabot config and OWASP ZAP baseline scan script

TypeScript: 13 pre-existing errors confirmed; new files add 0 new errors.

## Self-Check: PASSED
