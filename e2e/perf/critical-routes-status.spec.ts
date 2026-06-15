import { test, expect } from "@playwright/test";

/**
 * Critical public routes must return a successful status on a direct server
 * request against a PRODUCTION build. Guards the R2 regression where
 * /properties/[slug] returned HTTP 500 (DYNAMIC_SERVER_USAGE) because an
 * SSG-marked route rendered with cookies()-backed Supabase auth.
 *
 * Target the prod server: PERF_BASE_URL=http://localhost:3004 (next start).
 * Uses absolute URLs so it ignores the dev webServer baseURL.
 */
const BASE = process.env.PERF_BASE_URL ?? "http://localhost:3004";

// A slug guaranteed to resolve in mock mode (search_live_data off).
const MOCK_SLUG = "modern-2-bed-flat-clifton-bristol-sale";

const ROUTES = [
  { name: "homepage", path: "/" },
  { name: "search", path: "/search?type=buy" },
  { name: "property detail", path: `/properties/${MOCK_SLUG}` },
];

test.describe("Critical public routes return 2xx (prod build)", () => {
  for (const route of ROUTES) {
    test(`${route.name} returns < 400`, async ({ request }) => {
      const res = await request.get(`${BASE}${route.path}`);
      expect(
        res.status(),
        `${route.path} should not be a server error`,
      ).toBeLessThan(400);
    });
  }
});
