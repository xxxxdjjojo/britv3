/**
 * Server-less route-contract test.
 *
 * Guards that the dashboard/admin routes on disk stay in sync with the
 * navigation config: no broken nav links (→ 404s), and every static page is
 * either wired into nav or explicitly allow-listed as off-nav.
 *
 * Runs with no server and no Supabase — pure filesystem reads via the manifest.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROLE_NAV_ITEMS, TAB_CONFIG } from "@/config/navigation";
import { ROLE_TO_ROUTE } from "@/lib/constants";
import {
  dashboardPathForRole,
  savedDashboardPathForRole,
} from "@/lib/routes";
import type { UserRole as AppRole } from "@/types/auth";
import {
  getDashboardRoutes,
  KNOWN_OFFNAV_ROUTES,
  resolveAppRoute,
  staticRoutesForRole,
} from "./route-manifest";

const ALL_ROLES: readonly AppRole[] = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "agent",
  "service_provider",
  "mortgage_broker",
];

/** Drop query string; nav hrefs may carry `?type=...`. */
function urlPathOf(href: string): string {
  return href.split("?")[0];
}

/** Hrefs that point outside the dashboard/admin surfaces this test owns. */
function isDashboardOrAdmin(urlPath: string): boolean {
  return urlPath.startsWith("/dashboard") || urlPath.startsWith("/admin");
}

describe("route manifest", () => {
  it("discovers dashboard and admin pages matching the filesystem", () => {
    const appDir = path.resolve(__dirname, "../../app");

    const countPages = (relDir: string): number => {
      const out = execFileSync(
        "bash",
        [
          "-c",
          `find "${path.join(appDir, relDir)}" -name page.tsx | wc -l`,
        ],
        { encoding: "utf8" },
      );
      return Number(out.trim());
    };

    const fsDashboard = countPages("(protected)/dashboard");
    const fsAdmin = countPages("(admin)/admin");

    const routes = getDashboardRoutes();
    const manifestDashboard = routes.filter((r) => r.surface === "dashboard").length;
    const manifestAdmin = routes.filter((r) => r.surface === "admin").length;

    expect(routes.length).toBeGreaterThan(0);
    expect(manifestDashboard).toBeGreaterThanOrEqual(150);
    expect(manifestAdmin).toBeGreaterThanOrEqual(30);
    expect(manifestDashboard).toBe(fsDashboard);
    expect(manifestAdmin).toBe(fsAdmin);
  });
});

describe("resolveAppRoute", () => {
  it("matches a generic [role] route via the dynamic segment", () => {
    expect(resolveAppRoute("/dashboard/homebuyer/saved")).toContain(
      `${path.sep}[role]${path.sep}saved${path.sep}page.tsx`,
    );
  });

  it("prefers a literal directory over the dynamic [role] segment", () => {
    expect(resolveAppRoute("/dashboard/landlord/properties")).toContain(
      `${path.sep}landlord${path.sep}properties${path.sep}page.tsx`,
    );
  });

  it("resolves admin routes through the (admin) route group", () => {
    expect(resolveAppRoute("/admin/users")).toContain(
      `${path.sep}admin${path.sep}users${path.sep}page.tsx`,
    );
  });

  it("returns null for an unknown route", () => {
    expect(resolveAppRoute("/dashboard/does-not-exist/nope")).toBeNull();
  });
});

describe("navigation contract", () => {
  it("resolves every ROLE_NAV_ITEMS href to a real page", () => {
    const broken: string[] = [];

    for (const role of ALL_ROLES) {
      for (const item of ROLE_NAV_ITEMS[role]) {
        if (!resolveAppRoute(item.href)) {
          broken.push(`${role}: ${item.href}`);
        }
      }
    }

    expect(broken, `Broken ROLE_NAV_ITEMS hrefs:\n${broken.join("\n")}`).toEqual([]);
  });

  it("resolves every TAB_CONFIG href to a real page", () => {
    const broken: string[] = [];

    for (const role of ALL_ROLES) {
      for (const tab of TAB_CONFIG[role]) {
        const urlPath = urlPathOf(tab.href);
        // Tab bars include non-dashboard links (/search, /profile, /inbox)
        // owned by other surfaces; only assert the ones we own.
        if (!isDashboardOrAdmin(urlPath)) continue;
        if (!resolveAppRoute(urlPath)) {
          broken.push(`${role}: ${tab.href}`);
        }
      }
    }

    expect(broken, `Broken TAB_CONFIG hrefs:\n${broken.join("\n")}`).toEqual([]);
  });

  it("resolves dashboardPathForRole + savedDashboardPathForRole for all roles", () => {
    const broken: string[] = [];

    for (const role of ALL_ROLES) {
      const dash = dashboardPathForRole(role);
      if (!resolveAppRoute(dash)) broken.push(`dashboard(${role}): ${dash}`);

      const saved = savedDashboardPathForRole(role);
      // Provider + broker fall back to /dashboard (no role-specific saved page).
      if (!resolveAppRoute(saved)) broken.push(`saved(${role}): ${saved}`);
    }

    expect(broken, `Unresolved role paths:\n${broken.join("\n")}`).toEqual([]);
  });
});

describe("staticRoutesForRole", () => {
  it("expands shared [role] static pages for homebuyer and renter", () => {
    const homebuyer = staticRoutesForRole("homebuyer");
    const renter = staticRoutesForRole("renter");

    expect(homebuyer.length).toBeGreaterThan(0);
    expect(renter.length).toBeGreaterThan(0);
    expect(homebuyer).toContain("/dashboard/homebuyer/saved");
    expect(renter).toContain("/dashboard/renter/saved");
  });

  it("includes both literal-dir and shared [role] pages for role-specific roles", () => {
    const landlord = staticRoutesForRole("landlord");

    // Literal-dir page (physically under landlord/).
    expect(landlord).toContain("/dashboard/landlord/properties");
    // Shared [role] page expanded to the landlord slug.
    expect(landlord).toContain("/dashboard/landlord/saved");
  });

  it("never emits a dynamic [param] route for any role", () => {
    for (const role of ALL_ROLES) {
      for (const url of staticRoutesForRole(role)) {
        expect(url, `dynamic route leaked for ${role}: ${url}`).not.toContain("[");
      }
    }
  });
});

describe("nav-parity guard", () => {
  it("flags exactly the known off-nav static pages", () => {
    // 1. Every static dashboard URL reachable per role, plus shared pages.
    const staticDashboardUrls = new Set<string>();
    for (const role of ALL_ROLES) {
      for (const url of staticRoutesForRole(role)) {
        staticDashboardUrls.add(url);
      }
    }
    for (const entry of getDashboardRoutes()) {
      if (entry.surface === "dashboard" && entry.role === "shared" && !entry.dynamic) {
        staticDashboardUrls.add(entry.urlPath);
      }
    }

    // 2. Every dashboard URL referenced by nav/tab config, with [role] hrefs
    //    expanded to their concrete per-role slug so they match disk URLs.
    const navUrls = new Set<string>();
    const addNav = (href: string): void => {
      const urlPath = urlPathOf(href);
      if (urlPath.startsWith("/dashboard")) navUrls.add(urlPath);
    };
    for (const role of ALL_ROLES) {
      for (const item of ROLE_NAV_ITEMS[role]) addNav(item.href);
      for (const tab of TAB_CONFIG[role]) addNav(tab.href);
    }

    // 3. Static pages on disk that no nav references.
    const offNav = [...staticDashboardUrls]
      .filter((url) => !navUrls.has(url))
      .sort();

    expect(offNav).toEqual([...KNOWN_OFFNAV_ROUTES].sort());
  });

  it("references only slugs known to ROLE_TO_ROUTE", () => {
    // Sanity: the slugs we expand [role] into are real URL slugs.
    for (const role of ALL_ROLES) {
      expect(ROLE_TO_ROUTE[role]).toBeTruthy();
    }
  });
});
