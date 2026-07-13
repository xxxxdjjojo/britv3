import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Page-overflow guard — F4–F9
 *
 * Static assertions that each of the 5 overflow-prone route files carries the
 * responsive fix committed in PR-6.  These are intentionally narrow: they
 * verify the class string is present, not that the full component renders.
 */

const ROOT = join(process.cwd(), "src");

const postAJob = readFileSync(
  join(ROOT, "app/(main)/post-a-job/page.tsx"),
  "utf8",
);
const areaDetail = readFileSync(
  join(ROOT, "app/(main)/areas/[city]/[area]/page.tsx"),
  "utf8",
);
const areasIndex = readFileSync(
  join(ROOT, "app/(main)/areas/page.tsx"),
  "utf8",
);
const newHomes = readFileSync(
  join(ROOT, "app/(main)/new-homes/[developmentSlug]/page.tsx"),
  "utf8",
);
const notifications = readFileSync(
  join(ROOT, "app/(protected)/notifications/NotificationCentreClient.tsx"),
  "utf8",
);

describe("Page overflow guard (F4–F9)", () => {
  it("F4 post-a-job: outer grid is grid-cols-1 at base (sm: breakpoint for multi-col)", () => {
    expect(postAJob).toContain("grid-cols-1 sm:grid-cols-12");
  });

  it("F5 areas/[city]/[area]: tab list has overflow-x-auto", () => {
    expect(areaDetail).toContain("overflow-x-auto");
  });

  it("F5 areas/[city]/[area]: tab triggers have shrink-0 to prevent compression", () => {
    expect(areaDetail).toContain("shrink-0");
  });

  it("F6 areas index: hero search row has flex-wrap", () => {
    expect(areasIndex).toContain("flex-wrap");
  });

  it("F6 areas index: search button is w-full on mobile (sm:w-auto on wider)", () => {
    expect(areasIndex).toContain("w-full sm:w-auto");
  });

  it("F7 new-homes detail: content grid item has min-w-0 and header rows wrap (prevents 320px overflow)", () => {
    // min-w-0 must sit on the GRID ITEM (a grid child can otherwise refuse to
    // shrink below its content width); the badge/price rows wrap independently.
    expect(newHomes).toContain("min-w-0 space-y-6 lg:col-span-2");
    expect(newHomes).toContain("flex flex-wrap items-center gap-2");
    expect(newHomes).toContain("flex flex-wrap items-baseline");
  });

  it("F9 notifications: tab+action header row has flex-wrap and min-w-0", () => {
    expect(notifications).toContain("flex-wrap");
    expect(notifications).toContain("min-w-0");
  });
});
