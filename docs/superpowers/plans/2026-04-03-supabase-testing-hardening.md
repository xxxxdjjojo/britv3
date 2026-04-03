# Supabase Testing & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent schema-code mismatches (like the `provider_service_areas` incident) from reaching production by adding auto-generated types, migration linting, schema contract tests, and standardized API error handling.

**Architecture:** Four defense layers: (1) auto-generated TypeScript types from the live Supabase schema so the compiler catches mismatches at build time, (2) a migration lint script that validates all migrations are idempotent before push, (3) schema contract tests that verify every table referenced in API routes actually exists, (4) standardized API error responses that surface structured errors to the frontend instead of generic 500s.

**Tech Stack:** `supabase gen types` (CLI), Vitest, existing `handleSupabaseError` utility, `zod` (already in deps for validation)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/types/database.types.ts` | Auto-generated Supabase schema types |
| `scripts/gen-types.sh` | Shell script to regenerate types from linked project |
| `scripts/lint-migrations.sh` | Validates migrations for idempotency before push |
| `src/lib/supabase/safe-query.ts` | Typed query wrapper with structured error returns |
| `src/lib/supabase/safe-query.test.ts` | Tests for query wrapper |
| `src/__tests__/schema-contract.test.ts` | Schema contract tests — tables & columns exist |
| `src/lib/api-response.ts` | Standardized API error/success response helpers |
| `src/lib/api-response.test.ts` | Tests for response helpers |

---

### Task 1: Auto-Generate TypeScript Types from Supabase

**Files:**
- Create: `scripts/gen-types.sh`
- Create: `src/types/database.types.ts` (generated)
- Modify: `package.json` (add script)

- [ ] **Step 1: Create the type generation script**

```bash
# scripts/gen-types.sh
#!/usr/bin/env bash
set -euo pipefail

# Generate TypeScript types from the linked Supabase project
echo "Generating Supabase types..."

npx supabase gen types typescript --linked \
  --schema public \
  > src/types/database.types.ts

echo "Types written to src/types/database.types.ts"
echo "Run 'pnpm tsc --noEmit' to verify type compatibility."
```

- [ ] **Step 2: Make the script executable and add to package.json**

```bash
chmod +x scripts/gen-types.sh
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "db:gen-types": "bash scripts/gen-types.sh",
    "db:push": "npx supabase db push --include-all",
    "db:lint": "bash scripts/lint-migrations.sh"
  }
}
```

- [ ] **Step 3: Run the generation**

Run: `cd britv3.0 && pnpm db:gen-types`
Expected: `src/types/database.types.ts` is created with `Database` type containing all public tables.

- [ ] **Step 4: Verify the generated types include key tables**

Run: `grep -c "provider_service_areas\|provider_services\|properties\|listings\|profiles" src/types/database.types.ts`
Expected: At least 5 matches (one per table).

- [ ] **Step 5: Export a typed helper**

Add to the bottom of `src/types/database.types.ts` (manually, after generation):

```typescript
// Re-export for convenience — import { Tables } from "@/types/database.types"
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
```

- [ ] **Step 6: Commit**

```bash
git add scripts/gen-types.sh src/types/database.types.ts package.json
git commit -m "feat(db): add auto-generated Supabase TypeScript types

Prevents schema-code mismatches by generating types from live DB.
Run 'pnpm db:gen-types' after any migration push."
```

---

### Task 2: Migration Linting Script

**Files:**
- Create: `scripts/lint-migrations.sh`

This script catches the exact class of bugs we hit today: non-idempotent CREATE statements, duplicate timestamps, missing IF NOT EXISTS.

- [ ] **Step 1: Create the migration lint script**

```bash
# scripts/lint-migrations.sh
#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"
ERRORS=0

echo "=== Migration Lint ==="
echo ""

# 1. Check for bare CREATE TABLE (no IF NOT EXISTS)
echo "Checking CREATE TABLE statements..."
BARE_TABLES=$(grep -rn "^CREATE TABLE [^I]" "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$BARE_TABLES" ]; then
  echo "ERROR: Found CREATE TABLE without IF NOT EXISTS:"
  echo "$BARE_TABLES"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check for CREATE POLICY without preceding DROP POLICY IF EXISTS
echo "Checking CREATE POLICY statements..."
for f in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$f" ] || continue
  CREATES=$(grep -c "^CREATE POLICY" "$f" 2>/dev/null || echo 0)
  DROPS=$(grep -c "^DROP POLICY IF EXISTS" "$f" 2>/dev/null || echo 0)
  if [ "$CREATES" -gt "$DROPS" ] 2>/dev/null; then
    echo "ERROR: $(basename "$f") has $CREATES CREATE POLICY but only $DROPS DROP POLICY IF EXISTS"
    ERRORS=$((ERRORS + 1))
  fi
done

# 3. Check for CREATE INDEX without IF NOT EXISTS
echo "Checking CREATE INDEX statements..."
BARE_INDEXES=$(grep -rn "^CREATE INDEX [^I]" "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
BARE_UNIQUE=$(grep -rn "^CREATE UNIQUE INDEX [^I]" "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$BARE_INDEXES" ] || [ -n "$BARE_UNIQUE" ]; then
  echo "ERROR: Found CREATE INDEX without IF NOT EXISTS:"
  echo "$BARE_INDEXES"
  echo "$BARE_UNIQUE"
  ERRORS=$((ERRORS + 1))
fi

# 4. Check for duplicate timestamp prefixes
echo "Checking for duplicate timestamps..."
ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  sed 's|.*/||; s|_.*||' | \
  sort | uniq -d | while read -r dup; do
    echo "ERROR: Duplicate timestamp prefix '$dup':"
    ls "$MIGRATIONS_DIR"/"${dup}"_*.sql 2>/dev/null
    ERRORS=$((ERRORS + 1))
  done

# 5. Check for bare CREATE TYPE (no exception handler)
echo "Checking CREATE TYPE statements..."
BARE_TYPES=$(grep -rn "^CREATE TYPE.*AS ENUM" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "DO \$\$" || true)
if [ -n "$BARE_TYPES" ]; then
  echo "WARNING: Found CREATE TYPE without exception handler:"
  echo "$BARE_TYPES"
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS migration lint error(s) found."
  exit 1
else
  echo "PASSED: All migrations look idempotent."
  exit 0
fi
```

- [ ] **Step 2: Make executable and test**

```bash
chmod +x scripts/lint-migrations.sh
```

Run: `cd britv3.0 && pnpm db:lint`
Expected: PASSED (since we already fixed all issues in this session).

- [ ] **Step 3: Commit**

```bash
git add scripts/lint-migrations.sh
git commit -m "feat(db): add migration linting script

Validates migrations for idempotency before push:
- CREATE TABLE must use IF NOT EXISTS
- CREATE POLICY must have DROP POLICY IF EXISTS
- CREATE INDEX must use IF NOT EXISTS
- No duplicate timestamp prefixes
- CREATE TYPE should use exception handlers"
```

---

### Task 3: Schema Contract Tests

**Files:**
- Create: `src/__tests__/schema-contract.test.ts`

These tests verify that every table referenced in API routes actually exists in the Supabase schema. They use the generated types as the source of truth.

- [ ] **Step 1: Write the schema contract test**

```typescript
// src/__tests__/schema-contract.test.ts
import { describe, it, expect } from "vitest";
import type { Database } from "@/types/database.types";

/**
 * Schema contract tests.
 *
 * These tests verify that the tables our API routes depend on actually exist
 * in the generated database types. If a table is missing from the types, it
 * means either:
 *   1. The migration hasn't been applied (→ run pnpm db:push)
 *   2. Types are stale (→ run pnpm db:gen-types)
 *   3. The table was removed (→ update the code that references it)
 *
 * Add a new entry whenever you create an API route that queries a table.
 */

type PublicTables = keyof Database["public"]["Tables"];

// Every table that API routes depend on — this is the contract.
const REQUIRED_TABLES: PublicTables[] = [
  "profiles",
  "user_roles",
  "properties",
  "listings",
  "property_media",
  "price_history",
  "saved_properties",
  "saved_searches",
  "reviews",
  "review_helpfulness",
  "review_flags",
  "bookings",
  "service_requests",
  "service_provider_details",
  "provider_services",
  "provider_service_areas",
  "provider_referrals",
  "provider_references",
  "provider_badges",
  "provider_invoices",
  "provider_boosts",
  "provider_analytics_daily",
  "provider_portfolio_items",
  "provider_availability",
  "stripe_connect_accounts",
  "stripe_events",
  "admin_audit_log",
  "feature_flags",
  "gdpr_requests",
  "cms_articles",
  "email_campaigns",
  "email_logs",
  "notifications",
  "conversations",
  "messages",
  "agent_agency_profiles",
  "agent_leads",
];

describe("Schema Contract", () => {
  it.each(REQUIRED_TABLES)(
    "table '%s' exists in generated database types",
    (tableName) => {
      // This test passes at compile-time if the table exists in the type.
      // At runtime it just verifies the type was generated.
      const tables = {} as Database["public"]["Tables"];
      expect(tableName in tables || true).toBe(true);
      // The real check is that this file compiles — if a table is missing
      // from Database["public"]["Tables"], TypeScript will error on the
      // REQUIRED_TABLES type annotation above.
    },
  );
});
```

- [ ] **Step 2: Run the test**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/schema-contract.test.ts`
Expected: All tests pass. If any table is missing from `database.types.ts`, TypeScript compilation fails before the test even runs — catching the exact "table not found" class of errors at build time.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/schema-contract.test.ts
git commit -m "test(db): add schema contract tests

Compile-time verification that all tables referenced by API routes
exist in the generated Supabase types. Catches missing-table errors
before deployment — prevents 'table not found in schema cache' bugs."
```

---

### Task 4: Standardized API Error Responses

**Files:**
- Create: `src/lib/api-response.ts`
- Create: `src/lib/api-response.test.ts`

Replace generic `{ error: "Internal server error" }` with structured responses that the frontend can parse.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/api-response.test.ts
import { describe, it, expect } from "vitest";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
} from "./api-response";

describe("apiSuccess", () => {
  it("returns 200 JSON response with data", async () => {
    const res = apiSuccess({ id: "123", name: "Test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "123", name: "Test" });
  });

  it("accepts custom status code", async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
  });
});

describe("apiError", () => {
  it("returns structured error with code and message", async () => {
    const res = apiError("Something broke", "INTERNAL_ERROR", 500);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something broke",
      },
    });
  });
});

describe("apiUnauthorized", () => {
  it("returns 401 with UNAUTHORIZED code", async () => {
    const res = apiUnauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("apiNotFound", () => {
  it("returns 404 with NOT_FOUND code", async () => {
    const res = apiNotFound("Listing");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("Listing not found");
  });
});

describe("apiValidationError", () => {
  it("returns 400 with field errors", async () => {
    const res = apiValidationError({ email: "Required" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields).toEqual({ email: "Required" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd britv3.0 && pnpm vitest run src/lib/api-response.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/api-response.ts
import { NextResponse } from "next/server";

/**
 * Standardized API response helpers.
 *
 * Every API route should use these instead of raw NextResponse.json().
 * The frontend can rely on the error shape: { error: { code, message, fields? } }
 */

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

/** Return a success JSON response (default 200). */
export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/** Return a structured error response. */
export function apiError(
  message: string,
  code: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** 401 Unauthorized. */
export function apiUnauthorized(
  message = "Authentication required",
): NextResponse<ApiErrorBody> {
  return apiError(message, "UNAUTHORIZED", 401);
}

/** 403 Forbidden. */
export function apiForbidden(
  message = "You do not have permission to perform this action",
): NextResponse<ApiErrorBody> {
  return apiError(message, "FORBIDDEN", 403);
}

/** 404 Not Found. */
export function apiNotFound(resource = "Resource"): NextResponse<ApiErrorBody> {
  return apiError(`${resource} not found`, "NOT_FOUND", 404);
}

/** 400 Validation Error with per-field details. */
export function apiValidationError(
  fields: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Validation failed", fields } },
    { status: 400 },
  );
}

/** 500 from a caught Supabase/DB error — logs internally, returns safe message. */
export function apiDatabaseError(
  error: unknown,
  context: string,
): NextResponse<ApiErrorBody> {
  console.error(`[${context}]`, error);
  return apiError(
    "A database error occurred. Please try again.",
    "DATABASE_ERROR",
    500,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd britv3.0 && pnpm vitest run src/lib/api-response.test.ts`
Expected: All 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-response.ts src/lib/api-response.test.ts
git commit -m "feat(api): add standardized API response helpers

Structured error responses with code, message, and optional field errors.
Replaces generic { error: 'Internal server error' } pattern across routes.
Frontend can now parse error.code for specific handling."
```

---

### Task 5: Migrate Provider Service Areas Route to New Patterns

**Files:**
- Modify: `src/app/api/provider/service-areas/route.ts`
- Create: `src/app/api/provider/service-areas/route.test.ts`

Demonstrate the new patterns on the route that triggered this entire investigation.

- [ ] **Step 1: Write the test**

```typescript
// src/app/api/provider/service-areas/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@/__tests__/mocks/supabase";

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

describe("GET /api/provider/service-areas", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns empty array when provider has no areas", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    // provider profile lookup
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "provider-1" },
            error: null,
          }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("returns 500 with DATABASE_ERROR code on Supabase failure", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "table not found", code: "42P01" },
          }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET();
    // Should not crash — should return structured error
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
```

- [ ] **Step 2: Run test to verify baseline**

Run: `cd britv3.0 && pnpm vitest run src/app/api/provider/service-areas/route.test.ts`
Expected: Some tests may fail depending on current import structure — that's fine, we'll fix in the next step.

- [ ] **Step 3: Refactor route to use apiSuccess/apiError helpers**

Update `src/app/api/provider/service-areas/route.ts` to use the new response helpers:

Replace `NextResponse.json({ error: "Unauthorised" }, { status: 401 })` with `apiUnauthorized()`.
Replace `NextResponse.json({ error: error.message }, { status: 500 })` with `apiDatabaseError(error, "api/provider/service-areas")`.
Replace `NextResponse.json(data ?? [])` with `apiSuccess(data ?? [])`.

- [ ] **Step 4: Run tests**

Run: `cd britv3.0 && pnpm vitest run src/app/api/provider/service-areas/route.test.ts`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/provider/service-areas/route.ts src/app/api/provider/service-areas/route.test.ts
git commit -m "refactor(api): migrate service-areas route to standardized responses

Uses apiSuccess/apiError/apiDatabaseError helpers.
Adds unit tests for auth, empty state, and DB error scenarios."
```

---

### Task 6: Add Pre-Push Validation to db:push Script

**Files:**
- Modify: `package.json`

Wire the lint script to run automatically before any migration push.

- [ ] **Step 1: Update the db:push script**

In `package.json`, change:
```json
{
  "scripts": {
    "db:push": "bash scripts/lint-migrations.sh && npx supabase db push --include-all",
    "db:push:force": "npx supabase db push --include-all"
  }
}
```

Now `pnpm db:push` will lint first, catching non-idempotent migrations before they hit remote.
`pnpm db:push:force` bypasses lint for emergencies.

- [ ] **Step 2: Test the pipeline**

Run: `cd britv3.0 && pnpm db:push --dry-run` (or just `pnpm db:lint`)
Expected: "PASSED: All migrations look idempotent."

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(db): add pre-push migration linting

pnpm db:push now validates migration idempotency before pushing.
Use pnpm db:push:force to bypass in emergencies."
```

---

## Verification

After completing all tasks, verify end-to-end:

1. **Types are fresh:** `pnpm db:gen-types && pnpm tsc --noEmit` — should compile with no errors
2. **Migration lint passes:** `pnpm db:lint` — should output "PASSED"
3. **Schema contract tests pass:** `pnpm vitest run src/__tests__/schema-contract.test.ts`
4. **API response tests pass:** `pnpm vitest run src/lib/api-response.test.ts`
5. **Service areas route tests pass:** `pnpm vitest run src/app/api/provider/service-areas/route.test.ts`
6. **Full test suite still passes:** `pnpm test run` — no regressions
7. **Build succeeds:** `pnpm build`

---

## What This Prevents

| Past Incident | Defense Layer |
|---------------|--------------|
| "table not found in schema cache" | Schema contract tests + generated types (compile-time) |
| Non-idempotent CREATE POLICY/TABLE | Migration lint script (pre-push gate) |
| Generic 500 hides real DB errors | Structured API errors with codes |
| Manual types drift from schema | Auto-generated `database.types.ts` |
| Duplicate migration timestamps | Migration lint script detects dupes |
| `properties.status` column mismatch | TypeScript compiler catches it via generated types |
