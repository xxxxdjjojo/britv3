import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Skip env validation during tests
process.env.SKIP_ENV_VALIDATION = "true";

// Test-only secrets so services that require these at import don't throw
// in test runs. Real values are loaded only in dev/prod via .env.local.
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy_for_tests";
process.env.QUOTE_SIGNING_SECRET = process.env.QUOTE_SIGNING_SECRET ?? "test-quote-signing-secret";
process.env.REPLAY_SIGNING_SECRET = process.env.REPLAY_SIGNING_SECRET ?? "test-replay-signing-secret";
process.env.UNSUBSCRIBE_TOKEN_SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET ?? "test-unsub-secret";

// ---------------------------------------------------------------------------
// Global mocks for Supabase modules
// ---------------------------------------------------------------------------

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({})),
  createServerClient: vi.fn(() => ({})),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// Default next/navigation stub so client components that call useRouter()
// render in unit tests without an App Router provider. Per-file vi.mock calls
// override this, so existing suites keep their tailored mocks.
// ---------------------------------------------------------------------------

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
  };
});

// ---------------------------------------------------------------------------
// IntersectionObserver stub (happy-dom does not implement it).
// Used by LegalRightToc scroll-spy in legal page render tests.
// ---------------------------------------------------------------------------
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  },
);

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
