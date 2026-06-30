# Landlord Dashboard Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make landlord compliance/maintenance failures permanently harder to reintroduce by gating dashboard routes in CI, removing deposit ownership schema drift, and adding landlord Playwright smoke coverage.

**Architecture:** Route safety is enforced by a dedicated `test:routes` script and a separate `route-integrity` CI job so branch protection can require it independently. Deposit authorization is normalized around `deposit_registrations.tenancy_id -> tenancies.landlord_id`; app code and RLS stop relying on a duplicated `deposit_registrations.landlord_id`. Landlord smoke coverage uses the existing Playwright auth fixture and screenshot artifact paths.

**Tech Stack:** Next.js App Router, Vitest, GitHub Actions, Supabase SQL/RLS, Playwright.

---

### Task 1: Route Integrity CI Gate

**Files:**
- Modify: `.github/workflows/app-ci.yml`
- Modify: `package.json`
- Modify: `src/__tests__/ci/app-ci-workflow.test.ts`
- Create: `src/__tests__/routes/dashboard-reserved-slugs.test.ts`

- [ ] **Step 1: Write the failing CI contract**

Add assertions to `src/__tests__/ci/app-ci-workflow.test.ts`:

```ts
it("exposes route integrity as an independently requireable PR check", () => {
  const workflows = readWorkflowSources();
  const appCiWorkflow = workflows.find((source) => source.includes("name: App CI"));

  expect(appCiWorkflow).toContain("route-integrity:");
  expect(appCiWorkflow).toContain("pnpm test:routes");
});
```

Run:

```bash
corepack pnpm vitest run src/__tests__/ci/app-ci-workflow.test.ts
```

Expected: FAIL because there is no `route-integrity` job and no `test:routes` command.

- [ ] **Step 2: Add the minimal CI implementation**

Add `test:routes` to `package.json`:

```json
"test:routes": "vitest run src/__tests__/routes"
```

Add a `route-integrity` job to `.github/workflows/app-ci.yml` that checks out code, sets up pnpm/node, installs dependencies, and runs `pnpm test:routes`.

- [ ] **Step 3: Add reserved-slug regression tests**

Create `src/__tests__/routes/dashboard-reserved-slugs.test.ts` with a table asserting action slugs resolve to literal pages, not dynamic `[param]` pages:

```ts
const RESERVED_DASHBOARD_ACTION_ROUTES = [
  ["/dashboard/landlord/maintenance/new", "landlord/maintenance/new/page.tsx"],
  ["/dashboard/landlord/compliance/upload", "landlord/compliance/upload/page.tsx"],
  ["/dashboard/landlord/compliance/matrix", "landlord/compliance/matrix/page.tsx"],
  ["/dashboard/agent/listings/create", "agent/listings/create/page.tsx"],
  ["/dashboard/seller/listings/create", "seller/listings/create/page.tsx"],
  ["/dashboard/rfqs/create", "rfqs/create/page.tsx"],
] as const;
```

Run:

```bash
corepack pnpm test:routes
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/app-ci.yml package.json src/__tests__/ci/app-ci-workflow.test.ts src/__tests__/routes/dashboard-reserved-slugs.test.ts
git commit -m "ci(routes): gate dashboard route integrity"
```

### Task 2: Deposit Ownership Contract

**Files:**
- Modify: `src/services/landlord/deposit-service.ts`
- Modify: `src/__tests__/services/landlord/deposit-service.test.ts`
- Modify: `src/app/api/landlord/deposits/route.ts`
- Modify: `supabase/seed/05_landlord_data.sql`
- Modify: `src/types/landlord.ts`
- Create: `supabase/migrations/20260630162000_deposit_registrations_tenancy_owner_contract.sql`
- Create: `src/__tests__/supabase/deposit-rls-contract.test.ts`

- [ ] **Step 1: Write failing service tests**

Add tests proving create/get/update/list scope by owned tenancy IDs and never filter `deposit_registrations.landlord_id`.

Run:

```bash
corepack pnpm vitest run src/__tests__/services/landlord/deposit-service.test.ts
```

Expected: FAIL on the current `landlord_id` insert/filter code.

- [ ] **Step 2: Implement service contract**

Add helpers to fetch authenticated landlord-owned tenancy IDs and owned deposit IDs. Update:

```ts
createDepositRegistration(...)
getDepositByTenancy(...)
updateDeposit(...)
listDeposits(...)
```

so ownership is verified through `tenancies.landlord_id`, and remove `landlord_id` from deposit inserts/updates.

- [ ] **Step 3: Add migration/RLS contract test**

Add a static migration test that fails if new deposit RLS uses `landlord_id = auth.uid()` and passes only when policy checks tenancy ownership via `EXISTS (...) FROM tenancies`.

- [ ] **Step 4: Add forward migration**

Create a migration that:

```sql
DROP POLICY IF EXISTS "Landlords can manage their own deposit registrations" ON deposit_registrations;
CREATE POLICY "Landlords can manage deposits for owned tenancies"
  ON deposit_registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM tenancies WHERE tenancies.id = deposit_registrations.tenancy_id AND tenancies.landlord_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tenancies WHERE tenancies.id = deposit_registrations.tenancy_id AND tenancies.landlord_id = auth.uid()));
ALTER TABLE deposit_registrations DROP COLUMN IF EXISTS landlord_id;
```

Update seed inserts and `DepositRegistration` type to remove `landlord_id`.

- [ ] **Step 5: Commit**

```bash
git add src/services/landlord/deposit-service.ts src/__tests__/services/landlord/deposit-service.test.ts src/app/api/landlord/deposits/route.ts supabase/seed/05_landlord_data.sql src/types/landlord.ts supabase/migrations/20260630162000_deposit_registrations_tenancy_owner_contract.sql src/__tests__/supabase/deposit-rls-contract.test.ts
git commit -m "fix(deposits): authorize through tenancy ownership"
```

### Task 3: Landlord Playwright Smoke

**Files:**
- Create: `e2e/landlord-maintenance-compliance-smoke.spec.ts`
- Modify: `.github/workflows/app-ci.yml`
- Modify: `src/__tests__/ci/app-ci-workflow.test.ts`

- [ ] **Step 1: Write the smoke spec**

Use the existing auth fixture:

```ts
test.use({ role: "landlord" });
```

Check:
- `/dashboard/landlord/maintenance` renders `Maintenance Requests`
- `/dashboard/landlord/maintenance/new` renders `New Maintenance Request`
- `/dashboard/landlord/compliance` renders `Compliance Dashboard`
- `/dashboard/landlord/compliance/matrix` renders `Compliance Matrix`

Save screenshots to `test-results/landlord-maintenance-compliance/`.

- [ ] **Step 2: Wire CI contract**

Update `src/__tests__/ci/app-ci-workflow.test.ts` to require `landlord-maintenance-compliance-smoke`.

- [ ] **Step 3: Wire CI command**

Add a CI step after Chromium install:

```yaml
- name: Landlord maintenance/compliance smoke
  run: pnpm exec playwright test e2e/landlord-maintenance-compliance-smoke.spec.ts --project=chromium
```

Keep artifacts uploaded from `test-results/`.

- [ ] **Step 4: Verify with screenshots**

Run either the deterministic local DB gate:

```bash
scripts/e2e-local.sh landlord-maintenance-compliance-smoke
```

or, when local Supabase is unavailable, run against the existing authenticated dev server:

```bash
pnpm exec playwright test e2e/landlord-maintenance-compliance-smoke.spec.ts --project=chromium
```

- [ ] **Step 5: Commit**

```bash
git add e2e/landlord-maintenance-compliance-smoke.spec.ts .github/workflows/app-ci.yml src/__tests__/ci/app-ci-workflow.test.ts
git commit -m "test(e2e): smoke landlord compliance and maintenance"
```

### Final Verification

Run:

```bash
corepack pnpm test:routes
corepack pnpm vitest run src/__tests__/ci/app-ci-workflow.test.ts src/__tests__/services/landlord/deposit-service.test.ts src/__tests__/supabase/deposit-rls-contract.test.ts src/__tests__/lib/invite-codes.test.ts
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
pnpm exec playwright test e2e/landlord-maintenance-compliance-smoke.spec.ts --project=chromium
```

Expected: all commands exit 0; lint may retain existing warnings but no errors.
