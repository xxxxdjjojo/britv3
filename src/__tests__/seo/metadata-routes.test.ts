import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { brandConfig } from "@/config/brand";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

describe("SEO metadata routes", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it("uses the TrueDeed canonical URL by default for robots and sitemap", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { default: robots } = await import("@/app/robots");
    const { default: sitemap } = await import("@/app/sitemap");

    expect(robots().sitemap).toBe(`${brandConfig.canonicalUrl}/sitemap.xml`);

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.url).toBe(brandConfig.canonicalUrl);
    expect(entries.every((entry) => entry.url.startsWith(brandConfig.canonicalUrl))).toBe(true);
  });

  it("honors NEXT_PUBLIC_APP_URL for preview metadata routes", async () => {
    const previewUrl = "https://preview.truedeed.test";
    process.env.NEXT_PUBLIC_APP_URL = previewUrl;
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { default: robots } = await import("@/app/robots");
    const { default: sitemap } = await import("@/app/sitemap");

    expect(robots().sitemap).toBe(`${previewUrl}/sitemap.xml`);

    const entries = await sitemap();
    expect(entries[0]?.url).toBe(previewUrl);
    expect(entries.every((entry) => entry.url.startsWith(previewUrl))).toBe(true);
  });
});
