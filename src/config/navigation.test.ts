import { describe, it, expect } from "vitest";
import {
  NAV_ITEMS,
  FOOTER_LINKS,
  BREADCRUMB_MAP,
  ROLE_NAV_ITEMS,
  TAB_CONFIG,
  COMMAND_PALETTE_ROUTES,
  navLinkClasses,
  footerLinkClasses,
} from "./navigation";

// ---------------------------------------------------------------------------
// NAV_ITEMS
// ---------------------------------------------------------------------------

describe("NAV_ITEMS", () => {
  it("has exactly 6 top-level items", () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it("every NAV_ITEM has a non-empty label", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).toBeTruthy();
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("every dropdown section has at least 1 link", () => {
    for (const item of NAV_ITEMS) {
      if (item.sections) {
        for (const section of item.sections) {
          expect(section.links.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("has no duplicate hrefs across all dropdown links", () => {
    const hrefs: string[] = [];
    for (const item of NAV_ITEMS) {
      if (item.sections) {
        for (const section of item.sections) {
          for (const link of section.links) {
            hrefs.push(link.href);
          }
        }
      }
    }
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });

  it("has correct top-level labels in order", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      "Buy",
      "Rent",
      "Services",
      "Tools & Valuations",
      "Advice",
      "List / Sell",
    ]);
  });

  it("List / Sell item is marked as CTA", () => {
    const listSell = NAV_ITEMS.find((item) => item.label === "List / Sell");
    expect(listSell?.isCta).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FOOTER_LINKS
// ---------------------------------------------------------------------------

describe("FOOTER_LINKS", () => {
  it("has 7 columns", () => {
    expect(FOOTER_LINKS).toHaveLength(7);
  });

  it("every footer link href starts with /", () => {
    for (const column of FOOTER_LINKS) {
      if (column.links) {
        for (const link of column.links) {
          expect(link.href).toMatch(/^\//);
        }
      }
    }
  });

  it("brand column has tagline and socialLinks", () => {
    const brand = FOOTER_LINKS.find((col) => col.heading === "Brand");
    expect(brand?.tagline).toBeTruthy();
    expect(brand?.socialLinks?.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// BREADCRUMB_MAP
// ---------------------------------------------------------------------------

describe("BREADCRUMB_MAP", () => {
  it("is defined and has entries", () => {
    expect(BREADCRUMB_MAP).toBeDefined();
    expect(Object.keys(BREADCRUMB_MAP).length).toBeGreaterThan(0);
  });

  it("maps /search?type=buy to breadcrumb trail starting with Home", () => {
    const trail = BREADCRUMB_MAP["/search?type=buy"];
    expect(trail).toBeDefined();
    expect(trail[0].label).toBe("Home");
  });
});

// ---------------------------------------------------------------------------
// ROLE_NAV_ITEMS
// ---------------------------------------------------------------------------

describe("ROLE_NAV_ITEMS", () => {
  const ALL_ROLES = [
    "homebuyer",
    "renter",
    "seller",
    "landlord",
    "agent",
    "service_provider",
    "mortgage_broker",
  ] as const;

  it("has entries for all 7 roles", () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_NAV_ITEMS[role]).toBeDefined();
      expect(ROLE_NAV_ITEMS[role].length).toBeGreaterThan(0);
    }
  });

  it("every nav item has href, label, and icon", () => {
    for (const role of ALL_ROLES) {
      for (const item of ROLE_NAV_ITEMS[role]) {
        expect(item.href).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// TAB_CONFIG
// ---------------------------------------------------------------------------

describe("TAB_CONFIG", () => {
  const ALL_ROLES = [
    "homebuyer",
    "renter",
    "seller",
    "landlord",
    "agent",
    "service_provider",
    "mortgage_broker",
  ] as const;

  it("has entries for all 7 roles", () => {
    for (const role of ALL_ROLES) {
      expect(TAB_CONFIG[role]).toBeDefined();
      expect(TAB_CONFIG[role].length).toBeGreaterThan(0);
    }
  });

  it("mortgage_broker TAB_CONFIG has 5 tabs", () => {
    expect(TAB_CONFIG.mortgage_broker).toHaveLength(5);
  });

  it("every tab has label, href, and icon", () => {
    for (const role of ALL_ROLES) {
      for (const tab of TAB_CONFIG[role]) {
        expect(tab.label).toBeTruthy();
        expect(tab.href).toBeTruthy();
        expect(tab.icon).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// COMMAND_PALETTE_ROUTES
// ---------------------------------------------------------------------------

describe("COMMAND_PALETTE_ROUTES", () => {
  it("includes key public routes", () => {
    const hrefs = COMMAND_PALETTE_ROUTES.map((r) => r.href);
    expect(hrefs).toContain("/search");
    expect(hrefs).toContain("/valuation");
    expect(hrefs).toContain("/agents");
  });

  it("every route has label, href, section, and keywords", () => {
    for (const route of COMMAND_PALETTE_ROUTES) {
      expect(route.label).toBeTruthy();
      expect(route.href).toBeTruthy();
      expect(route.section).toBeTruthy();
      expect(route.keywords.length).toBeGreaterThan(0);
    }
  });

  it("dashboard routes have roles specified", () => {
    const dashboardRoutes = COMMAND_PALETTE_ROUTES.filter((r) =>
      r.href.startsWith("/dashboard"),
    );
    for (const route of dashboardRoutes) {
      expect(route.roles).toBeDefined();
      expect(route.roles!.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// navLinkClasses
// ---------------------------------------------------------------------------

describe("navLinkClasses", () => {
  it("returns string containing 'text-base'", () => {
    expect(navLinkClasses()).toContain("text-base");
  });

  it("returns string containing 'brand-primary' when active", () => {
    expect(navLinkClasses({ active: true })).toContain("brand-primary");
  });

  it("returns footer-specific classes for footer variant", () => {
    const classes = navLinkClasses({ variant: "footer" });
    expect(classes).toContain("text-neutral-400");
    expect(classes).toContain("hover:text-white");
  });

  it("returns transparent variant classes", () => {
    const classes = navLinkClasses({ variant: "transparent" });
    expect(classes).toContain("text-white");
  });

  it("returns sidebar variant classes with gap-3 and rounded-lg", () => {
    const classes = navLinkClasses({ variant: "sidebar" });
    expect(classes).toContain("gap-3");
    expect(classes).toContain("rounded-lg");
  });

  it("returns mobile variant classes with min-h-11", () => {
    const classes = navLinkClasses({ variant: "mobile" });
    expect(classes).toContain("min-h-11");
  });
});

// ---------------------------------------------------------------------------
// footerLinkClasses
// ---------------------------------------------------------------------------

describe("footerLinkClasses", () => {
  it("returns footer-appropriate classes", () => {
    const classes = footerLinkClasses();
    expect(classes).toContain("text-neutral-400");
    expect(classes).toContain("hover:text-white");
  });
});
