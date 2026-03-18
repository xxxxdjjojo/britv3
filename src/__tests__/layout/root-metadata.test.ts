import { describe, it, expect } from "vitest";
import { rootMetadata } from "@/lib/seo/root-metadata";

/**
 * Root layout metadata tests.
 *
 * Verifies that the SEO foundation fields are present and correctly shaped.
 * metadataBase is critical: without it, OG image URLs on child pages are
 * rendered as relative paths and break social share previews.
 *
 * The metadata constants live in @/lib/seo/root-metadata to allow testing
 * in isolation from next/font/google (a Next.js build-time API).
 */

describe("rootMetadata", () => {
  it("has metadataBase set to https://britestate.co.uk", () => {
    expect(rootMetadata.metadataBase).toBeInstanceOf(URL);
    expect(rootMetadata.metadataBase?.href).toBe("https://britestate.co.uk/");
  });

  it("preserves the existing title", () => {
    expect(rootMetadata.title).toBe("Britestate | UK Property Portal");
  });

  it("preserves the existing description", () => {
    expect(rootMetadata.description).toBe(
      "Find your perfect UK property. Search, compare, and transact with AI-powered matching, verified agents, and trusted tradespeople.",
    );
  });

  it("has openGraph with siteName, locale, and type", () => {
    expect(rootMetadata.openGraph).toBeDefined();
    expect(rootMetadata.openGraph?.siteName).toBe("Britestate");
    expect(rootMetadata.openGraph?.locale).toBe("en_GB");
    expect(rootMetadata.openGraph?.type).toBe("website");
  });

  it("has twitter card set to summary_large_image with correct site handle", () => {
    expect(rootMetadata.twitter).toBeDefined();
    expect(rootMetadata.twitter?.card).toBe("summary_large_image");
    expect(rootMetadata.twitter?.site).toBe("@britestate");
  });
});
