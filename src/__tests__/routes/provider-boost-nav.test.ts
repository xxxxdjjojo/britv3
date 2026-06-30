/**
 * Guard: the provider "Boost My Profile" page must be reachable from the LIVE
 * dashboard navigation — not just exist on disk.
 *
 * Root cause this prevents: the boost link was added to a dead, never-imported
 * sidebar component (components/dashboard/provider/ProviderSidebar.tsx) while the
 * real sidebar (components/layout/Sidebar.tsx) renders ROLE_NAV_ITEMS from
 * config/navigation.ts. The page existed but was unreachable, and was hidden
 * behind a KNOWN_OFFNAV_ROUTES allowlist entry so no test caught it.
 *
 * These assertions tie the boost page to the live nav config and the dashboard
 * home, so it can never silently fall out of the UI again.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ROLE_NAV_ITEMS } from "@/config/navigation";

import { KNOWN_OFFNAV_ROUTES, resolveAppRoute } from "./route-manifest";

const BOOST_ROUTE = "/dashboard/provider/boost";

describe("provider Boost My Profile is reachable from the live dashboard", () => {
  it("appears in the live provider sidebar nav (ROLE_NAV_ITEMS.service_provider)", () => {
    const hrefs = ROLE_NAV_ITEMS.service_provider.map((item) => item.href);
    expect(hrefs).toContain(BOOST_ROUTE);
  });

  it("resolves to a real page", () => {
    expect(resolveAppRoute(BOOST_ROUTE)).not.toBeNull();
  });

  it("is surfaced as a quick action on the provider dashboard home page", () => {
    const home = readFileSync(
      path.join(process.cwd(), "src/app/(protected)/dashboard/provider/page.tsx"),
      "utf8",
    );
    expect(home).toContain(BOOST_ROUTE);
  });

  it("is NOT allowlisted as an off-nav route (it must be in the nav)", () => {
    expect([...KNOWN_OFFNAV_ROUTES]).not.toContain(BOOST_ROUTE);
  });
});
