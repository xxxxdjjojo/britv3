# RLS Audit Report

**Project:** Britestate v3.0
**Date:** 2026-03-07
**Status:** Template — populate after running `tests/security/rls-audit.sql` against production/staging database

---

## Overview

This report documents the Row-Level Security (RLS) coverage for all tables in the Britestate
PostgreSQL database (Supabase). Every table containing user data must have RLS enabled with
appropriate policies to prevent unauthorized cross-user data access.

**How to run the audit:**

```bash
# Option 1: Supabase SQL Editor (Dashboard)
# Paste contents of tests/security/rls-audit.sql and run each query block

# Option 2: psql
psql "$DATABASE_URL" -f tests/security/rls-audit.sql

# Option 3: Automated test (requires exec_sql RPC in Supabase)
cd britv3.0 && pnpm test tests/security/rls-audit.test.ts
```

---

## Tables Audited

The following tables are expected across all phases of the Britestate build:

### Domain: Users & Auth (Phase 1)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| profiles | [ ] | - | Users: read own, update own. Admin: read all |
| notification_preferences | [ ] | - | Users: read own, update own |
| push_subscriptions | [ ] | - | Users: read own, insert own, delete own |
| platform_events | [ ] | - | Users: read own events. No direct insert (service role) |

### Domain: Properties & Listings (Phase 2)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| properties | [ ] | - | Public: read published. Owner: full CRUD. Admin: read all |
| property_images | [ ] | - | Public: read published listing images. Owner: CRUD own |
| saved_properties | [ ] | - | Users: CRUD own saves only |
| saved_searches | [ ] | - | Users: CRUD own searches only |

### Domain: Communication (Phase 3)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| conversations | [ ] | - | Participants: read own conversations |
| messages | [ ] | - | Participants: read/insert in own conversations |

### Domain: Marketplace & Services (Phase 4)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| provider_profiles | [ ] | - | Public: read verified providers. Owner: update own |
| rfqs | [ ] | - | Buyers: CRUD own. Providers: read assigned |
| rfq_responses | [ ] | - | Providers: CRUD own responses. Buyers: read responses for own RFQs |
| bookings | [ ] | - | Parties: read own bookings. Service role: status updates |
| provider_reviews | [ ] | - | Public: read. Authors: insert own. No updates (immutable) |
| review_responses | [ ] | - | Providers: insert response to own reviews. Public: read |
| review_helpfulness | [ ] | - | Users: insert own votes. Public: read counts |
| portfolios | [ ] | - | Public: read. Providers: CRUD own items |

### Domain: Financial (Phase 5)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| (financial tables managed via Stripe/service role) | N/A | - | No direct user table access |

### Domain: Landlord Tools (Phase 6)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| tenancies | [ ] | - | Landlords: CRUD own. Tenants: read own |
| maintenance_requests | [ ] | - | Tenants: insert/read own. Landlords: read all in property |
| rent_payments | [ ] | - | Landlords: read all. Tenants: read own |
| expenses | [ ] | - | Landlords: CRUD own |
| compliance_documents | [ ] | - | Landlords: CRUD own |

### Domain: Admin (Phase 7)

| Table | RLS Enabled | Policies | Coverage Assessment |
|-------|-------------|----------|---------------------|
| content_reports | [ ] | - | Users: insert. Admins: read/update all |
| listing_moderation | [ ] | - | Admins: full access. No user access |

---

## RLS Status Summary

> **TODO:** Populate after running `rls-audit.sql` Query 4 against the live database.

```
Tables with RLS ENABLED:  [run query to populate]
Tables with RLS DISABLED: [run query to populate]
Tables with no policies:  [run query to populate]
```

---

## Findings

> **TODO:** Document findings after running audit queries.

### Critical Issues (P0 — Fix Before Launch)

- [ ] Run Query 1 and list all tables without RLS

### High Priority (P1 — Fix Within 24hrs)

- [ ] Run Query 3 and list RLS-enabled tables without policies

### Medium Priority (P2)

- [ ] Review policies for least-privilege compliance

---

## Recommendations

1. **Service-role-only tables:** Any table intentionally accessible only via `service_role` (bypassing RLS)
   should be documented here. These tables MUST have no direct PostgREST/anon-key access paths.

2. **Policy naming convention:** All policies should follow: `{table}_{role}_{action}` e.g.
   `profiles_user_select`, `profiles_admin_select_all`.

3. **Test automation:** The RLS audit test (`tests/security/rls-audit.test.ts`) should run in CI
   against a seeded test database. Configure `exec_sql` RPC in Supabase or use direct `psql` in CI.

4. **Periodic re-audit:** Re-run this audit after each migration that adds new tables.

5. **Policy documentation:** For each table, document the intended access pattern:
   - Who can SELECT (everyone, owner, role-based)?
   - Who can INSERT (authenticated users, specific roles, service-role only)?
   - Who can UPDATE (owner only, admin, nobody)?
   - Who can DELETE (owner only, admin, soft-delete only)?

---

## Audit History

| Date | Auditor | Tables Audited | Issues Found | Issues Resolved |
|------|---------|----------------|--------------|-----------------|
| 2026-03-07 | Initial template | 0 (template) | 0 | 0 |

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Audit SQL: `britv3.0/tests/security/rls-audit.sql`
- Automated test: `britv3.0/tests/security/rls-audit.test.ts`
