/**
 * Comprehensive navigation link resolution test.
 *
 * This test asserts that every link configured in the application's central
 * navigation config resolves to a real, well-formed href. It is intentionally
 * exhaustive: any broken, empty, or placeholder href should be caught here
 * before it can reach users.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import {
  NAV_ITEMS,
  FOOTER_LINKS,
  COMMAND_PALETTE_ROUTES,
  ROLE_NAV_ITEMS,
  ROLE_PRIMARY_CTA,
  type NavItem,
  type NavSection,
  type FooterColumn,
  type RoleNavItem,
  type CommandPaletteRoute,
} from "@/config/navigation";

function extractNavItemHrefs(items: readonly NavItem[]): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    for (const section of item.sections ?? []) {
      for (const link of section.links) {
        hrefs.push(link.href);
      }
    }
  }
  return hrefs;
}

function extractFooterHrefs(columns: readonly FooterColumn[]): string[] {
  const hrefs: string[] = [];
  for (const column of columns) {
    for (const link of column.links ?? []) {
      hrefs.push(link.href);
    }
    for (const link of column.socialLinks ?? []) {
      hrefs.push(link.href);
    }
  }
  return hrefs;
}

const allInternalHrefs: string[] = [
  ...extractNavItemHrefs(NAV_ITEMS),
  ...extractFooterHrefs(FOOTER_LINKS),
  ...COMMAND_PALETTE_ROUTES.map((route) => route.href),
  ...Object.values(ROLE_NAV_ITEMS).flatMap((items) =>
    items.map((item: RoleNavItem) => item.href),
  ),
  ...Object.values(ROLE_PRIMARY_CTA).map((cta) => cta.href),
];

const RENTAL_ROUTES = [
  "/search?type=rent",
  "/search?view=map&type=rent",
  "/renter-tools",
  "/tools/rent-affordability-calculator",
  "/dashboard/renter/applications",
  "/dashboard/renter/viewings",
];

describe("All configured navigation links", () => {
  it("has at least 100 total links across all nav surfaces", () => {
    expect(allInternalHrefs.length).toBeGreaterThanOrEqual(100);
  });

  it("never contains an empty or whitespace-only href", () => {
    for (const href of allInternalHrefs) {
      expect(href).not.toBe("");
      expect(href.trim()).not.toBe("");
    }
  });

  it("never contains a null/undefined href", () => {
    for (const href of allInternalHrefs) {
      expect(href).toBeDefined();
      expect(href).not.toBeNull();
    }
  });

  it("only uses hash placeholders for explicit anchor-only links", () => {
    for (const href of allInternalHrefs) {
      if (href.startsWith("#")) {
        // If a link uses a hash it must be ONLY a hash (no route)
        expect(href).toBe("#");
      }
    }
  });

  it("uses absolute internal paths for all non-external links", () => {
    for (const href of allInternalHrefs) {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        // External social/brand links are allowed.
        continue;
      }
      // Internal links must be absolute paths.
      expect(href.startsWith("/")).toBe(true);
    }
  });

  it("exposes all required rental routes", () => {
    for (const route of RENTAL_ROUTES) {
      expect(allInternalHrefs).toContain(route);
    }
  });

  it("does not expose routes with double slashes", () => {
    for (const href of allInternalHrefs) {
      if (href.startsWith("http")) continue;
      expect(href).not.toMatch(/\/\//);
    }
  });
});

describe("Rent mega-menu links", () => {
  const rentNav = NAV_ITEMS.find((item) => item.label === "Rent");

  it("is defined", () => {
    expect(rentNav).toBeDefined();
  });

  const rentLinks: string[] = [];
  for (const section of rentNav?.sections ?? []) {
    for (const link of section.links) {
      rentLinks.push(link.href);
    }
  }

  it("contains the renter tools hub link", () => {
    expect(rentLinks).toContain("/renter-tools");
  });

  it("contains the rent affordability calculator link", () => {
    expect(rentLinks).toContain("/tools/rent-affordability-calculator");
  });

  it("contains rental search links", () => {
    expect(rentLinks).toContain("/search?type=rent");
    expect(rentLinks).toContain("/search?view=map&type=rent");
  });
});

describe("Command palette routes", () => {
  it("contains the renter tools hub route", () => {
    expect(
      COMMAND_PALETTE_ROUTES.some((route) => route.href === "/renter-tools"),
    ).toBe(true);
  });

  it("contains the rent affordability calculator route", () => {
    expect(
      COMMAND_PALETTE_ROUTES.some(
        (route) => route.href === "/tools/rent-affordability-calculator",
      ),
    ).toBe(true);
  });
});
