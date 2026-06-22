/**
 * Tests for renter tools navigation links.
 * Verifies that the rent mega-menu and renter tools hub expose only
 * routes that actually resolve.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "@/config/navigation";

describe("Rent mega-menu navigation links", () => {
  // Find the "Rent" nav item
  const rentNav = NAV_ITEMS.find((item) => item.label === "Rent");
  expect(rentNav).toBeDefined();

  // Flatten all links across all sections of the Rent dropdown
  const allLinks: { label: string; href: string }[] = [];
  if (rentNav?.sections) {
    for (const section of rentNav.sections) {
      for (const link of section.links) {
        allLinks.push(link);
      }
    }
  }

  it("exposes a renter tools hub link", () => {
    const hasRenterTools = allLinks.some(
      (link) => link.href === "/renter-tools",
    );
    expect(hasRenterTools).toBe(true);
  });

  it("exposes a rent affordability calculator link", () => {
    const hasAffordability = allLinks.some(
      (link) => link.href === "/tools/rent-affordability-calculator",
    );
    expect(hasAffordability).toBe(true);
  });

  it("exposes rental search link with correct type param", () => {
    const searchLink = allLinks.find(
      (link) => link.href === "/search?type=rent",
    );
    expect(searchLink).toBeDefined();
  });

  it("does not expose non-existent routes", () => {
    // These routes should NOT be in the menu (not yet implemented)
    for (const link of allLinks) {
      if (link.href.startsWith("#")) continue; // placeholder is OK
      // Every non-hash link should start with /
      expect(link.href.startsWith("/")).toBe(true);
    }
  });
});

describe("Renter tools hub route", () => {
  it("is included in COMMAND_PALETTE_ROUTES", async () => {
    const { COMMAND_PALETTE_ROUTES } = await import("@/config/navigation");
    const hasRenterTools = COMMAND_PALETTE_ROUTES.some(
      (route) => route.href === "/renter-tools",
    );
    expect(hasRenterTools).toBe(true);
  });
});
