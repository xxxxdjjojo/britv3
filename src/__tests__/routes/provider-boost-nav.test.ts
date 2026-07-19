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
import {
  evaluateProviderAccess,
  providerRequirementForPath,
  type ProviderAccessState,
} from "@/services/provider/provider-access-policy";

import { KNOWN_OFFNAV_ROUTES, resolveAppRoute } from "./route-manifest";

const BOOST_ROUTE = "/dashboard/provider/boost";

/** A fully complete/verified provider — all gate requirements satisfied. */
const COMPLETE_PROVIDER: ProviderAccessState = {
  role: "service_provider",
  emailConfirmed: true,
  adminVerified: true,
  peerVouchCount: 3,
  clientVouchCount: 3,
  grandfathered: false,
  vouchComplete: true,
  subscriptionActive: true,
  stripeConnectReady: true,
};

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

  it("is GATED behind the provider verification/vouch gate for incomplete providers", () => {
    // PR3 removed the boost exemption: boost is a "business" surface, so an
    // incomplete provider is redirected to /dashboard/provider/verification
    // (the proxy maps every non-subscription denial to that landing page).
    const requirement = providerRequirementForPath(BOOST_ROUTE);
    expect(requirement).toBe("business");

    const vouchIncomplete = evaluateProviderAccess(
      { ...COMPLETE_PROVIDER, vouchComplete: false },
      requirement,
    );
    expect(vouchIncomplete).toEqual({
      allowed: false,
      reason: "vouch_incomplete",
    });

    const adminUnverified = evaluateProviderAccess(
      { ...COMPLETE_PROVIDER, adminVerified: false },
      requirement,
    );
    expect(adminUnverified.allowed).toBe(false);
  });

  it("stays reachable for a complete/verified provider", () => {
    const requirement = providerRequirementForPath(BOOST_ROUTE);
    expect(evaluateProviderAccess(COMPLETE_PROVIDER, requirement)).toEqual({
      allowed: true,
    });
  });
});
