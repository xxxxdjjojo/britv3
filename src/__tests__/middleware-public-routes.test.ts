import { describe, it, expect } from "vitest";
import { PUBLIC_ROUTES } from "@/lib/constants";

/**
 * Replicates the matchesRoute logic from src/middleware.ts.
 * Supports exact match and prefix match (e.g., /legal matches /legal/terms).
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

describe("PUBLIC_ROUTES", () => {
  describe("required public routes are present", () => {
    const requiredRoutes = [
      "/",
      "/about",
      "/search",
      "/properties",
      "/marketplace",
      "/services",
      "/agents",
      "/help",
      "/blog",
      "/legal",
      "/valuation",
      "/areas",
      "/contact",
      "/careers",
      "/press",
      "/sold-prices",
    ];

    it.each(requiredRoutes)("includes %s", (route) => {
      expect(PUBLIC_ROUTES).toContain(route);
    });
  });

  describe("removed wrong paths are absent", () => {
    it("does not contain /terms (moved to /legal/terms)", () => {
      expect(PUBLIC_ROUTES).not.toContain("/terms");
    });

    it("does not contain /privacy (moved to /legal/privacy)", () => {
      expect(PUBLIC_ROUTES).not.toContain("/privacy");
    });
  });

  describe("protected routes are NOT in PUBLIC_ROUTES", () => {
    const protectedRoutes = ["/dashboard", "/admin", "/api"];

    it.each(protectedRoutes)("does not include %s", (route) => {
      expect(PUBLIC_ROUTES).not.toContain(route);
    });
  });
});

describe("matchesRoute — prefix matching", () => {
  describe("/legal prefix covers all sub-pages", () => {
    const legalSubRoutes = [
      "/legal",
      "/legal/terms",
      "/legal/privacy",
      "/legal/cookies",
      "/legal/accessibility",
      "/legal/complaints",
    ];

    it.each(legalSubRoutes)("matches %s", (pathname) => {
      expect(matchesRoute(pathname, PUBLIC_ROUTES)).toBe(true);
    });
  });

  describe("/blog prefix covers sub-pages", () => {
    it("matches /blog", () => {
      expect(matchesRoute("/blog", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /blog/some-article-slug", () => {
      expect(matchesRoute("/blog/some-article-slug", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /blog/category/advice", () => {
      expect(matchesRoute("/blog/category/advice", PUBLIC_ROUTES)).toBe(true);
    });
  });

  describe("/guides prefix covers the gated lead-magnet pages", () => {
    it("matches /guides/landlord-guide (public lead magnet)", () => {
      expect(matchesRoute("/guides/landlord-guide", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches the downloadable PDF asset", () => {
      expect(
        matchesRoute("/guides/landlord-guide.pdf", PUBLIC_ROUTES),
      ).toBe(true);
    });
  });

  describe("/areas prefix covers city/area pages", () => {
    it("matches /areas", () => {
      expect(matchesRoute("/areas", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /areas/london", () => {
      expect(matchesRoute("/areas/london", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /areas/london/shoreditch", () => {
      expect(matchesRoute("/areas/london/shoreditch", PUBLIC_ROUTES)).toBe(true);
    });
  });

  describe("prefix matching does not grant false positives", () => {
    it("does not match /dashboard via /blog prefix", () => {
      expect(matchesRoute("/dashboard", PUBLIC_ROUTES)).toBe(false);
    });

    it("does not match /admin", () => {
      expect(matchesRoute("/admin", PUBLIC_ROUTES)).toBe(false);
    });

    it("does not match /admin/users", () => {
      expect(matchesRoute("/admin/users", PUBLIC_ROUTES)).toBe(false);
    });

    it("does not match /dashboard/homebuyer", () => {
      expect(matchesRoute("/dashboard/homebuyer", PUBLIC_ROUTES)).toBe(false);
    });
  });

  describe("exact matches still work", () => {
    it("matches / exactly", () => {
      expect(matchesRoute("/", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /contact exactly", () => {
      expect(matchesRoute("/contact", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /careers exactly", () => {
      expect(matchesRoute("/careers", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /sold-prices exactly", () => {
      expect(matchesRoute("/sold-prices", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /area-prices exactly (free postcode price page is public)", () => {
      expect(matchesRoute("/area-prices", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /valuation exactly", () => {
      expect(matchesRoute("/valuation", PUBLIC_ROUTES)).toBe(true);
    });

    it("matches /press exactly", () => {
      expect(matchesRoute("/press", PUBLIC_ROUTES)).toBe(true);
    });
  });
});
