# Developer role integration — root cause + permanent fix (TDD)

## Symptom
Logged in as `developer@demo.truedeed.co.uk`, the user "keeps getting redirected to homebuyer" and cannot reach a working developer experience.

## Root causes (confirmed by reproduction + DB inspection, not guessed)

1. **RC1 — demo `active_role` is `homebuyer`, not `developer`.** The `on_auth_user_created`
   trigger created the profile row (default `homebuyer`) at the same instant as the
   `auth.users` insert; the seed's `INSERT INTO profiles … ON CONFLICT (id) DO NOTHING`
   was a no-op. Proxy + `/dashboard` redirect read `profile.active_role` → homebuyer.

2. **RC2 — "developer" is NOT a first-class role, so the role-based routing/nav/landing
   system has no concept of it (architectural).** The membership-only model (`developer_members`)
   scopes data correctly via RLS, but:
   - `/dashboard` → `resolveDashboardDestination(active_role)` → `/dashboard/<role>` (never `/dashboard/developer`).
   - `(protected)/dashboard/layout.tsx` renders `<Sidebar/>` → `ROLE_NAV_ITEMS[active_role]`, so
     `/dashboard/developer` renders wrapped in **homebuyer** chrome (wrong sidebar, "Welcome back / Homebuyer", role switcher = Homebuyer).
   - There is no nav path from the logged-in dashboard to `/dashboard/developer`.

   (Reproduction proof: `/dashboard/developer` itself does NOT redirect — it renders the real
   Calthorpe Homes dashboard — but inside homebuyer chrome, and login never lands there.)

## Permanent fix (chosen): make `developer` a first-class role + keep membership for data scoping

`developer` becomes a `UserRole` (drives routing / landing / sidebar). `developer_members`
stays (org→user mapping + RLS scoping). Role = "you are a developer" (UX/routing);
membership = "you belong to Calthorpe Homes" (data). The TS compiler enforces completeness:
every `Record<UserRole, …>` must gain a `developer` entry.

### Alternatives considered (rejected)
- **B. Special-case membership in `resolveDashboardDestination` + per-route layout override.**
  Scattered special-casing, fights the role system, leaves the role switcher/chrome wrong. Rejected.
- **C. Leave as-is, document the direct URL.** A workaround, not a fix. Rejected.

## Surface (compiler-guided — `Record<UserRole,…>`)
- `src/types/auth.ts` — add `developer` to `UserRole`.
- `src/lib/constants.ts` — `ROUTE_TO_ROLE.developer = "developer"` (⇒ `ROLE_TO_ROUTE.developer`).
- `src/lib/routes.ts` — `DASHBOARD_BASE_BY_ROLE.developer = "/dashboard/developer"`.
- `src/components/layout/Sidebar.tsx` — `ROLE_LABELS.developer = "Developer"`.
- `src/config/navigation.ts` — `ROLE_NAV_ITEMS.developer`, `TAB_CONFIG.developer`, `ROLE_PRIMARY_CTA.developer`.
- `src/__tests__/routes/route-manifest.ts` — drop `/dashboard/developer` from `KNOWN_OFFNAV_ROUTES`
  (now wired into the sidebar) and allowlist the new sub-pages if needed.
- DB: `ALTER TYPE user_role ADD VALUE 'developer'`; set demo user `active_role='developer'` + `user_roles`.
- Seed: `INSERT INTO profiles … ON CONFLICT (id) DO UPDATE SET active_role='developer'`.

### Completeness — developer dashboard sub-pages (so the sidebar is real, links resolve)
- `/dashboard/developer` (Overview — exists)
- `/dashboard/developer/leads` (full lead pipeline + CSV)
- `/dashboard/developer/viewings`
- `/dashboard/developer/developments`

## TDD order
1. RED: tests for `ROLE_NAV_ITEMS.developer`, `dashboardPathForRole('developer')`,
   `resolveDashboardDestination({active_role:'developer'})`, nav links resolve (route-contract),
   + Playwright e2e (login → `/dashboard/developer` + developer sidebar). Commit failing.
2. GREEN: add the role + fill every `Record<UserRole>`, build sub-pages, migration, demo data.
3. VERIFY: typecheck, full `src/__tests__` guard layer, build, deploy (`vercel --prod`),
   Playwright before/after screenshots.

## Permanent guardrails proposed
- `developer` in the role enum + onboarding ⇒ future developers self-serve.
- Seed uses `DO UPDATE` (not `DO NOTHING`) for active_role so re-seed can't regress.
- Route-contract nav-parity test keeps every `/dashboard/developer/*` page wired or allowlisted.
