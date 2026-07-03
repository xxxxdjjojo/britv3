import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard test for F3 — "More" bottom-sheet on mobile.
 *
 * Locks the structural contract between BottomTabBar and MoreDrawer:
 * - BottomTabBar imports MoreDrawer and ROLE_NAV_ITEMS
 * - MoreDrawer.tsx exists with the expected shape
 */

const ROOT = join(process.cwd(), "src");

const bottomTabBarPath = join(ROOT, "components/mobile/BottomTabBar.tsx");
const moreDrawerPath = join(ROOT, "components/mobile/MoreDrawer.tsx");

const bottomTabBar = readFileSync(bottomTabBarPath, "utf8");

describe("BottomTabBar imports MoreDrawer and ROLE_NAV_ITEMS", () => {
  it("imports MoreDrawer from ./MoreDrawer", () => {
    expect(bottomTabBar).toMatch(/import.*MoreDrawer.*from\s+['"]\.\/MoreDrawer['"]/);
  });

  it("imports ROLE_NAV_ITEMS from @/config/navigation", () => {
    expect(bottomTabBar).toMatch(/import.*ROLE_NAV_ITEMS.*from\s+['"]@\/config\/navigation['"]/);
  });
});

describe("MoreDrawer.tsx exists and has correct structure", () => {
  it("file exists", () => {
    expect(existsSync(moreDrawerPath)).toBe(true);
  });

  const moreDrawer = existsSync(moreDrawerPath)
    ? readFileSync(moreDrawerPath, "utf8")
    : "";

  it("contains DrawerContent (vaul sheet)", () => {
    expect(moreDrawer).toContain("DrawerContent");
  });

  it("contains pb-safe for bottom safe-area inset", () => {
    expect(moreDrawer).toContain("pb-safe");
  });

  it("contains excludeHrefs prop for deduplication", () => {
    expect(moreDrawer).toContain("excludeHrefs");
  });
});
