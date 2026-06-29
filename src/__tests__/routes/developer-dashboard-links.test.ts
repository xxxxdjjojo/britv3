import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROLE_NAV_ITEMS } from "@/config/navigation";
import { dashboardPathForRole } from "@/lib/routes";
import { resolveDashboardDestination } from "@/lib/auth/admin-access";
import type { UserRole } from "@/types/auth";

// "developer" is being promoted to a first-class role. These tests are RED until
// the role is added + the developer sidebar links resolve to real page files.

const DEV: UserRole = "developer" as UserRole;
const APP = join(process.cwd(), "src/app/(protected)");

/** Map a /dashboard/... href to its App Router page file. */
function pageFileFor(href: string): string {
  const clean = href.split("?")[0].replace(/^\//, "");
  return join(APP, clean, "page.tsx");
}

describe("developer is a first-class dashboard role", () => {
  it("routes a developer to /dashboard/developer", () => {
    expect(dashboardPathForRole(DEV)).toBe("/dashboard/developer");
  });

  it("lands a logged-in developer on their dashboard, not a role-select", () => {
    expect(
      resolveDashboardDestination({ active_role: "developer", is_admin: false }),
    ).toBe("/dashboard/developer");
  });

  it("has a developer sidebar with an Overview entry", () => {
    const items = ROLE_NAV_ITEMS[DEV];
    expect(items, "ROLE_NAV_ITEMS.developer must exist").toBeTruthy();
    expect(items.length).toBeGreaterThan(0);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard/developer");
  });

  it("every developer sidebar link resolves to a real page (no 404s)", () => {
    const items = ROLE_NAV_ITEMS[DEV] ?? [];
    const broken = items
      .map((i) => i.href)
      .filter((href) => href.startsWith("/dashboard/developer"))
      .filter((href) => !existsSync(pageFileFor(href)));
    expect(broken, `missing page files for: ${broken.join(", ")}`).toEqual([]);
  });
});
