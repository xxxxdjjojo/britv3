# Admin Access Model

Admin access is an overlay on a normal product account. It is not a `UserRole`.

A profile has configured admin access only when both conditions are true:

- `profiles.is_admin = true`
- `profiles.admin_role` is one of `super_admin`, `moderation_admin`, `ops_admin`, or `dev_admin`

Generic login and `/dashboard` send configured admins to `/admin`. Product dashboards remain reachable through explicit role URLs such as `/dashboard/homebuyer`, `/dashboard/provider`, and `/dashboard/broker`.

Missing `admin_role` is a configuration error. The application sends that profile to `/forbidden` instead of silently falling back to a product dashboard.

## Source Of Truth

Admin authorization must read `public.profiles`. Do not grant admin access from `auth.users.raw_user_meta_data`, `app_metadata`, or cached JWT claims. Metadata can help with display or product-role optimizations, but it is not the authorization source for elevated permissions.

## Test Users

Local seeded users use `TestPassword123!`.

- `test-admin@britestate.test` has `is_admin = true` and `admin_role = 'super_admin'`.
- `test-buyer@britestate.test` is a normal homebuyer and must not reach `/admin`.
- `test-provider@britestate.test` uses the `service_provider` enum role and must route to `/dashboard/provider`.
- `test-broker@britestate.test` uses the `mortgage_broker` enum role and must route to `/dashboard/broker`.

## Diagnostics

Check a suspected admin profile:

```sql
select
  u.email,
  p.id,
  p.active_role,
  p.is_admin,
  p.admin_role,
  p.updated_at
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('<affected-admin-email>');
```

Find incomplete admin profiles:

```sql
select
  u.email,
  p.id,
  p.active_role,
  p.is_admin,
  p.admin_role,
  p.updated_at
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin = true
  and p.admin_role is null;
```

## One-Time Repair

After deploying the code fix, repair the affected profile:

```sql
update public.profiles p
set is_admin = true,
    admin_role = coalesce(p.admin_role, 'super_admin'),
    updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('<affected-admin-email>');
```

Use `moderation_admin`, `ops_admin`, or `dev_admin` instead of `super_admin` when the user should not have full administrative permissions.

## Verification

Run the targeted regression suite:

```bash
./node_modules/.bin/vitest run \
  'src/lib/auth/admin-access.test.ts' \
  'src/app/(protected)/dashboard/page.test.ts' \
  'src/app/api/admin/team/invite/route.test.ts' \
  'src/__tests__/routes/admin-link-integrity.test.ts' \
  'src/__tests__/backend-blueprint/jwt-claims-middleware.test.ts' \
  'src/components/layout/ProtectedHeader.test.tsx' \
  'src/__tests__/dashboard/role-guard.test.ts'
```

Run the browser proof:

```bash
./node_modules/.bin/playwright test e2e/admin-access.spec.ts --project=chromium
```

Expected screenshots are written to `test-results/admin-access/`:

- `admin-dashboard-landing.png`
- `admin-console.png`
- `homebuyer-admin-blocked.png`
