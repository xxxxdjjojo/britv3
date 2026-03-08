import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";

// Skip env validation during tests
process.env.SKIP_ENV_VALIDATION = "true";

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
// Reset all mocks between tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks();
});
