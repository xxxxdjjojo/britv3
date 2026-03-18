import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * We re-import the module inside each test that cares about env-var behaviour
 * because module-level constants are evaluated once at import time.  Vitest's
 * module cache must be reset between those tests.
 */
describe("SEO config — static constants", () => {
  it("exports SITE_NAME as 'Britestate'", async () => {
    const { SITE_NAME } = await import("@/lib/seo/config");
    expect(SITE_NAME).toBe("Britestate");
  });

  it("exports DEFAULT_OG_IMAGE as the expected path", async () => {
    const { DEFAULT_OG_IMAGE } = await import("@/lib/seo/config");
    expect(DEFAULT_OG_IMAGE).toBe("/images/og/britestate-default.png");
  });
});

describe("SEO config — SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to britestate.co.uk when NEXT_PUBLIC_APP_URL is undefined", async () => {
    // stubEnv only sets values; to simulate an unset var we delete it then
    // reset modules so the constant is re-evaluated.
    const original = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.resetModules();
    const { SITE_URL } = await import("@/lib/seo/config");
    expect(SITE_URL).toBe("https://britestate.co.uk");
    // Restore
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = original;
    }
    vi.resetModules();
  });

  it("uses NEXT_PUBLIC_APP_URL when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://staging.britestate.co.uk");
    vi.resetModules();
    const { SITE_URL } = await import("@/lib/seo/config");
    expect(SITE_URL).toBe("https://staging.britestate.co.uk");
  });
});

describe("getCanonicalUrl", () => {
  // Import once for the bulk of the path tests — env is not changed here.
  it("returns SITE_URL (no trailing slash) for '/'", async () => {
    const { getCanonicalUrl, SITE_URL } = await import("@/lib/seo/config");
    const base = SITE_URL.replace(/\/+$/, "");
    expect(getCanonicalUrl("/")).toBe(base);
  });

  it("joins a simple path", async () => {
    const { getCanonicalUrl, SITE_URL } = await import("@/lib/seo/config");
    const base = SITE_URL.replace(/\/+$/, "");
    expect(getCanonicalUrl("/about")).toBe(`${base}/about`);
  });

  it("joins a nested path", async () => {
    const { getCanonicalUrl, SITE_URL } = await import("@/lib/seo/config");
    const base = SITE_URL.replace(/\/+$/, "");
    expect(getCanonicalUrl("/properties/my-slug")).toBe(
      `${base}/properties/my-slug`,
    );
  });

  it("strips trailing slash from non-root paths", async () => {
    const { getCanonicalUrl, SITE_URL } = await import("@/lib/seo/config");
    const base = SITE_URL.replace(/\/+$/, "");
    expect(getCanonicalUrl("/about/")).toBe(`${base}/about`);
  });

  it("handles paths without a leading slash", async () => {
    const { getCanonicalUrl, SITE_URL } = await import("@/lib/seo/config");
    const base = SITE_URL.replace(/\/+$/, "");
    expect(getCanonicalUrl("about")).toBe(`${base}/about`);
  });

  it("handles nested paths without a leading slash", async () => {
    const { getCanonicalUrl, SITE_URL } = await import("@/lib/seo/config");
    const base = SITE_URL.replace(/\/+$/, "");
    expect(getCanonicalUrl("properties/my-slug")).toBe(
      `${base}/properties/my-slug`,
    );
  });

  it("avoids double slashes when SITE_URL has a trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com/");
    vi.resetModules();
    const { getCanonicalUrl } = await import("@/lib/seo/config");
    expect(getCanonicalUrl("/about")).toBe("https://example.com/about");
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
