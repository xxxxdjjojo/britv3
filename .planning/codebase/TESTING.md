# Testing Patterns

**Analysis Date:** 2026-03-06

## Project State

This is a fresh Next.js 16 scaffold (Britestate v3.0). No test framework is currently installed or configured. The documented conventions from v2.0 (`britv3.0/docs/project memory 2026.txt`) specify the intended testing strategy. This document captures both the current state and the target patterns to implement.

**Root project directory:** `britv3.0/` (contains `src/`, `package.json`, etc.)

## Test Framework

**Runner (to install):**
- Vitest (unit and integration tests)
- Playwright (E2E tests)

**Current state:** No test dependencies in `britv3.0/package.json`. No test config files exist. No test files exist.

**Target Dependencies to Add:**
```json
{
  "devDependencies": {
    "vitest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "@playwright/test": "latest"
  }
}
```

**Assertion Library:**
- Vitest built-in (`expect`) for unit tests
- `@testing-library/jest-dom` for DOM assertions
- Playwright built-in assertions for E2E

**Run Commands (target):**
```bash
pnpm test                    # Run all unit tests (Vitest)
pnpm run test:watch          # Watch mode
pnpm run test:ui             # Vitest UI mode
pnpm run test:coverage       # Coverage report
pnpm run test:e2e            # Run all E2E (Playwright)
pnpm run test:e2e:headed     # With browser visible
pnpm run test:e2e:debug      # Debug mode
pnpm run test:e2e:report     # Show Playwright report
pnpm run test:integration    # Integration tests
```

## Test File Organization

**Location:** Separate `tests/` directory at project root (not co-located)

**Target Structure:**
```
britv3.0/
├── tests/
│   ├── unit/                    # Unit tests mirroring src/ structure
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── components/
│   ├── integration/             # API and service integration tests
│   │   ├── api/
│   │   └── services/
│   ├── e2e/                     # Playwright E2E tests
│   │   ├── auth/
│   │   ├── search/
│   │   ├── dashboard/
│   │   ├── marketplace/
│   │   ├── viewings/
│   │   ├── payments/
│   │   └── admin/
│   ├── performance/             # Load tests
│   ├── visual-regression/       # Visual tests
│   └── fixtures/                # Shared test fixtures
│       ├── users.ts
│       └── properties.ts
```

**Naming:**
- Unit test files: `*.spec.ts` or `*.test.ts`
- E2E test files: `*.spec.ts`
- Fixture files: descriptive names matching domain - `users.ts`, `properties.ts`

## Test Structure

**Unit Test Pattern (Vitest):**
```typescript
import { describe, test, expect, vi } from "vitest";
import { calculateMortgage } from "@/services/properties/property-service";

describe("calculateMortgage", () => {
  test("calculates monthly payment correctly", () => {
    const result = calculateMortgage({
      principal: 300000,
      interestRate: 0.05,
      termYears: 25,
    });

    expect(result.monthlyPayment).toBeCloseTo(1753.77, 2);
  });

  test("handles zero interest rate", () => {
    const result = calculateMortgage({
      principal: 300000,
      interestRate: 0,
      termYears: 25,
    });

    expect(result.monthlyPayment).toBe(1000);
  });
});
```

**Patterns:**
- Use `describe` blocks to group related tests by function/module
- Use `test` (not `it`) as the test function name
- One assertion concept per test (multiple `expect` calls are fine if testing one behavior)
- Descriptive test names starting with verb: "calculates...", "handles...", "shows...", "returns..."

## E2E Test Pattern (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("user can login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error-message")).toBeVisible();
  });
});
```

## Mocking

**Framework:** Vitest built-in (`vi`)

**Patterns:**
```typescript
import { describe, test, expect, vi } from "vitest";

// Mock a module
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
}));

// Mock a function
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
```

**What to Mock:**
- External API calls (Supabase, Stripe, Anthropic Claude)
- Browser APIs not available in test environment
- Time-dependent operations (`vi.useFakeTimers()`)
- Environment variables

**What NOT to Mock:**
- Pure utility functions (test them directly)
- Internal module interactions in integration tests
- React component rendering (use Testing Library instead)

## Fixtures and Factories

**Test Data:**
```typescript
// tests/fixtures/users.ts
export const testUsers = {
  homebuyer: {
    email: "homebuyer@test.com",
    password: "Test123!",
    role: "homebuyer",
  },
  provider: {
    email: "provider@test.com",
    password: "Test123!",
    role: "service_provider",
  },
  agent: {
    email: "agent@test.com",
    password: "Test123!",
    role: "agent",
  },
  admin: {
    email: "admin@test.com",
    password: "Test123!",
    role: "admin",
  },
};

// tests/fixtures/properties.ts
export const testProperties = {
  londonFlat: {
    title: "Modern 2 Bed Flat in London",
    price: 450000,
    bedrooms: 2,
    type: "flat",
    location: { lat: 51.5074, lng: -0.1278 },
  },
};
```

**Location:** `tests/fixtures/`

## Coverage

**Requirements:** Target > 85% for unit tests, 100% API route coverage for integration tests

**View Coverage:**
```bash
pnpm run test:coverage
```

**Coverage output:** `britv3.0/coverage/` directory (gitignored)

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, utility modules, pure component logic
- Location: `tests/unit/`
- Runner: Vitest
- Mocking: Mock external dependencies, test logic in isolation

**Integration Tests:**
- Scope: API routes, service-to-database interactions, multi-service workflows
- Location: `tests/integration/`
- Runner: Vitest
- Mocking: Minimal - mock only external third-party services (Stripe, Claude)

**E2E Tests:**
- Scope: Full user journeys through the browser
- Location: `tests/e2e/`
- Runner: Playwright
- Critical journeys: Authentication, Property Search, Viewing Booking, Service Booking, Payment Flow, Admin Actions

**Visual Regression Tests:**
- Location: `tests/visual-regression/`
- Status: Planned but not yet implemented

**Performance Tests:**
- Location: `tests/performance/`
- Status: Planned but not yet implemented

## Common Patterns

**Async Testing:**
```typescript
import { describe, test, expect } from "vitest";

describe("PropertyService", () => {
  test("fetches properties successfully", async () => {
    const result = await propertyService.search({ location: "London" });

    expect(result).toBeDefined();
    expect(result.properties).toHaveLength(10);
  });
});
```

**Error Testing:**
```typescript
import { describe, test, expect } from "vitest";

describe("AuthService", () => {
  test("throws on invalid credentials", async () => {
    await expect(
      authService.login({ email: "bad@test.com", password: "wrong" })
    ).rejects.toThrow("Invalid credentials");
  });
});
```

**React Component Testing:**
```typescript
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PropertyCard } from "@/components/properties/PropertyCard";

test("renders property title", () => {
  render(<PropertyCard title="London Flat" price={450000} />);

  expect(screen.getByText("London Flat")).toBeInTheDocument();
});
```

## Vitest Configuration (to create)

Create `britv3.0/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.ts", "tests/integration/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/app/**/layout.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## Pre-commit Validation

**Target validation pipeline:**
```bash
pnpm run lint          # ESLint
pnpm run type-check    # TypeScript strict checking
pnpm test              # Vitest unit tests
```

Run full validation before commits with: `pnpm run validate`

---

*Testing analysis: 2026-03-06*
