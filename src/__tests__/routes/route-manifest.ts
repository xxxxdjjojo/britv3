/**
 * Server-less route manifest for the Britestate dashboard + admin surfaces.
 *
 * Single source of truth that reads the real `src/app` tree (no Next.js
 * runtime, no Supabase) and exposes:
 *   - getDashboardRoutes()  — every dashboard/admin page.tsx as a RouteEntry
 *   - resolveAppRoute(url)  — App Router segment matching (literal > dynamic)
 *   - staticRoutesForRole() — non-dynamic dashboard URLs reachable per role
 *
 * Consumed by route-contract.test.ts and (later) Playwright smoke specs.
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import { ROUTE_TO_ROLE } from "@/lib/constants";
import { dashboardPathForRole } from "@/lib/routes";
import type { UserRole as AppRole } from "@/types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RouteRole = string | "[role]" | "admin" | "shared";

export type RouteEntry = Readonly<{
  urlPath: string;
  role: RouteRole;
  file: string;
  dynamic: boolean;
  surface: string;
}>;

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

const APP_DIR = path.resolve(__dirname, "../../app");
// Route pages are `.tsx`-only by repo convention (no `.jsx`/`.js`/`.mdx` pages).
const PAGE_FILE = "page.tsx";

/** A route group directory like `(protected)` — transparent to the URL. */
function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/** A dynamic directory like `[role]` or `[id]`. */
function isDynamicSegment(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

function listDirs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function hasPage(dir: string): boolean {
  return readdirSync(dir, { withFileTypes: true }).some(
    (entry) => entry.isFile() && entry.name === PAGE_FILE,
  );
}

// ---------------------------------------------------------------------------
// getDashboardRoutes
// ---------------------------------------------------------------------------

type Surface = Readonly<{
  /** Absolute directory to walk. */
  root: string;
  /** Number of URL segments contributed before the first walked dir. */
  baseUrl: string;
  surface: string;
}>;

const SURFACES: readonly Surface[] = [
  {
    root: path.join(APP_DIR, "(protected)", "dashboard"),
    baseUrl: "/dashboard",
    surface: "dashboard",
  },
  {
    root: path.join(APP_DIR, "(admin)", "admin"),
    baseUrl: "/admin",
    surface: "admin",
  },
];

/** Walk a surface root, emitting a RouteEntry for every page.tsx found. */
function walkSurface(surface: Surface): RouteEntry[] {
  const entries: RouteEntry[] = [];

  function recurse(dir: string, urlSegments: string[]): void {
    if (hasPage(dir)) {
      const urlPath = `${surface.baseUrl}${urlSegments.map((s) => `/${s}`).join("")}`;
      entries.push({
        urlPath,
        role: roleForUrl(urlPath, surface.surface),
        file: path.join(dir, PAGE_FILE),
        dynamic: urlSegments.some(isDynamicSegment),
        surface: surface.surface,
      });
    }

    for (const child of listDirs(dir)) {
      // Test fixtures live in __tests__ dirs; never a real route.
      if (child === "__tests__") continue;

      const nextSegments = isRouteGroup(child)
        ? urlSegments
        : [...urlSegments, child];
      recurse(path.join(dir, child), nextSegments);
    }
  }

  recurse(surface.root, []);
  return entries;
}

const SHARED_DASHBOARD_DIRS = new Set([
  "bookings",
  "rfqs",
  "reviews",
  "saved",
]);

/** Classify the role that owns a dashboard/admin URL. */
function roleForUrl(urlPath: string, surface: string): RouteRole {
  if (surface === "admin") return "admin";

  // urlPath: /dashboard/<seg>/...
  const seg = urlPath.split("/")[2] ?? "";
  if (seg === "[role]") return "[role]";
  if (SHARED_DASHBOARD_DIRS.has(seg)) return "shared";

  // ROUTE_TO_ROLE maps URL slug → app role (e.g. provider → service_provider).
  const role = ROUTE_TO_ROLE[seg];
  return role ?? "shared";
}

let cachedRoutes: RouteEntry[] | null = null;

export function getDashboardRoutes(): RouteEntry[] {
  if (cachedRoutes) return cachedRoutes;
  cachedRoutes = SURFACES.flatMap(walkSurface);
  return cachedRoutes;
}

// ---------------------------------------------------------------------------
// resolveAppRoute — App Router segment matching
// ---------------------------------------------------------------------------

/**
 * Mirror Next.js App Router matching against the real `src/app` tree.
 *
 * For each URL segment, a literal directory is preferred; a single dynamic
 * `[x]` directory matches otherwise. Route groups `(group)` are transparent
 * and do not consume a URL segment. Returns the matched page.tsx path or null.
 */
export function resolveAppRoute(urlPath: string): string | null {
  const segments = urlPath.split("?")[0].split("/").filter(Boolean);
  return matchSegments(APP_DIR, segments);
}

function matchSegments(dir: string, segments: string[]): string | null {
  if (segments.length === 0) {
    return hasPage(dir) ? path.join(dir, PAGE_FILE) : null;
  }

  const [head, ...rest] = segments;
  const children = listDirs(dir);

  // 1. Literal match preferred.
  if (children.includes(head)) {
    const matched = matchSegments(path.join(dir, head), rest);
    if (matched) return matched;
  }

  // 2. Single dynamic `[x]` directory.
  const dynamicDir = children.find(isDynamicSegment);
  if (dynamicDir) {
    const matched = matchSegments(path.join(dir, dynamicDir), rest);
    if (matched) return matched;
  }

  // 3. Route groups are transparent — descend without consuming `head`.
  for (const group of children.filter(isRouteGroup)) {
    const matched = matchSegments(path.join(dir, group), segments);
    if (matched) return matched;
  }

  return null;
}

// ---------------------------------------------------------------------------
// staticRoutesForRole — non-dynamic dashboard URLs reachable for a role
// ---------------------------------------------------------------------------

/**
 * Static (non-dynamic) dashboard URLs reachable for a given role: the union of
 * the role-specific literal dir routes and the generic `[role]` dir routes
 * expanded to that role's URL slug. Excludes any path with a `[param]` segment.
 */
export function staticRoutesForRole(role: AppRole): string[] {
  const base = dashboardPathForRole(role); // e.g. /dashboard/provider — also the literal-dir prefix
  const result = new Set<string>();

  for (const entry of getDashboardRoutes()) {
    // Generic `[role]` routes: the `[role]` segment is a role placeholder, not
    // a dynamic data param. Expand it to this role's base, but skip routes
    // whose remaining segments carry a real `[param]` (e.g. `[role]/.../[id]`).
    if (entry.role === "[role]") {
      const remainder = entry.urlPath.replace("/dashboard/[role]", "");
      if (remainder.includes("[")) continue;
      result.add(`${base}${remainder}`);
      continue;
    }

    if (entry.dynamic) continue;

    // Routes physically under the role's literal directory.
    if (entry.urlPath === base || entry.urlPath.startsWith(`${base}/`)) {
      result.add(entry.urlPath);
    }
  }

  return [...result].sort();
}

// ---------------------------------------------------------------------------
// KNOWN_OFFNAV_ROUTES — pages that exist but are wired into no nav
// ---------------------------------------------------------------------------

/**
 * Static dashboard pages that exist on disk but are referenced by neither
 * ROLE_NAV_ITEMS nor TAB_CONFIG. A NEW page that nobody wires into nav will
 * fail route-contract.test.ts until it is added to nav or to this allowlist.
 *
 * Generated from the live tree on 2026-06-16; keep in sync deliberately.
 * On failure, the nav-parity test's diff IS the regeneration source for this list.
 */
export const KNOWN_OFFNAV_ROUTES: readonly string[] = [
  // Dashboard root — role-redirect landing, never linked directly.
  "/dashboard",
  // Shared dashboard surfaces (linked from in-page CTAs, not the sidebar).
  "/dashboard/bookings",
  "/dashboard/reviews",
  "/dashboard/rfqs",
  "/dashboard/rfqs/create",
  "/dashboard/saved",
  // Agent — role-specific sub-pages plus the shared `[role]` tools, none in nav.
  "/dashboard/agent/ai-match",
  "/dashboard/agent/analytics",
  "/dashboard/agent/analytics/branch",
  "/dashboard/agent/analytics/competitors",
  "/dashboard/agent/applications",
  "/dashboard/agent/billing",
  "/dashboard/agent/billing/boost",
  "/dashboard/agent/billing/checkout/one-time",
  "/dashboard/agent/billing/checkout/subscription",
  "/dashboard/agent/billing/confirmation",
  "/dashboard/agent/billing/failed",
  "/dashboard/agent/billing/invoices",
  "/dashboard/agent/billing/payment-methods",
  "/dashboard/agent/billing/refund",
  "/dashboard/agent/billing/subscription",
  "/dashboard/agent/billing/truedeed",
  "/dashboard/agent/calculators",
  "/dashboard/agent/crm",
  "/dashboard/agent/documents",
  "/dashboard/agent/integrations",
  "/dashboard/agent/introductions",
  "/dashboard/agent/listings/archived",
  "/dashboard/agent/listings/create",
  "/dashboard/agent/listings/new",
  "/dashboard/agent/listings/sold",
  "/dashboard/agent/moving",
  "/dashboard/agent/offers",
  "/dashboard/agent/profile",
  "/dashboard/agent/profile/branding",
  "/dashboard/agent/referrals",
  "/dashboard/agent/reviews",
  "/dashboard/agent/sales",
  "/dashboard/agent/sales/appraisal",
  "/dashboard/agent/sales/reports",
  "/dashboard/agent/saved",
  "/dashboard/agent/searches",
  "/dashboard/agent/services",
  "/dashboard/agent/team/branches",
  "/dashboard/agent/team/roles",
  "/dashboard/agent/tenancy",
  "/dashboard/agent/viewings/book",
  "/dashboard/agent/viewings/feedback",
  // Broker — shared `[role]` tools plus broker-specific pages, none in nav.
  "/dashboard/broker/ai-match",
  "/dashboard/broker/applications",
  "/dashboard/broker/billing",
  "/dashboard/broker/billing/checkout/one-time",
  "/dashboard/broker/billing/checkout/subscription",
  "/dashboard/broker/billing/confirmation",
  "/dashboard/broker/billing/failed",
  "/dashboard/broker/billing/invoices",
  "/dashboard/broker/billing/payment-methods",
  "/dashboard/broker/billing/refund",
  "/dashboard/broker/billing/subscription",
  "/dashboard/broker/calculators",
  "/dashboard/broker/documents",
  "/dashboard/broker/listings",
  "/dashboard/broker/listings/new",
  "/dashboard/broker/moving",
  "/dashboard/broker/offers",
  "/dashboard/broker/profile",
  "/dashboard/broker/referrals",
  "/dashboard/broker/reviews",
  "/dashboard/broker/saved",
  "/dashboard/broker/searches",
  "/dashboard/broker/services",
  "/dashboard/broker/tenancy",
  "/dashboard/broker/viewings",
  "/dashboard/broker/viewings/book",
  // Homebuyer — shared `[role]` pages not wired into the homebuyer nav.
  // (ai-match/calculators/moving/offers moved INTO the homebuyer nav in the
  //  fix/supabase-migration-version-collisions base, so they are no longer off-nav.)
  "/dashboard/homebuyer/applications",
  "/dashboard/homebuyer/billing",
  "/dashboard/homebuyer/billing/checkout/one-time",
  "/dashboard/homebuyer/billing/checkout/subscription",
  "/dashboard/homebuyer/billing/confirmation",
  "/dashboard/homebuyer/billing/failed",
  "/dashboard/homebuyer/billing/invoices",
  "/dashboard/homebuyer/billing/payment-methods",
  "/dashboard/homebuyer/billing/refund",
  "/dashboard/homebuyer/billing/subscription",
  "/dashboard/homebuyer/listings",
  "/dashboard/homebuyer/listings/new",
  "/dashboard/homebuyer/referrals",
  "/dashboard/homebuyer/services",
  "/dashboard/homebuyer/tenancy",
  "/dashboard/homebuyer/viewings/book",
  // Landlord — deep tools/sub-pages plus shared `[role]` tools, none in nav.
  "/dashboard/landlord/ai-match",
  "/dashboard/landlord/applications",
  "/dashboard/landlord/billing",
  "/dashboard/landlord/billing/checkout/one-time",
  "/dashboard/landlord/billing/checkout/subscription",
  "/dashboard/landlord/billing/confirmation",
  "/dashboard/landlord/billing/failed",
  "/dashboard/landlord/billing/invoices",
  "/dashboard/landlord/billing/payment-methods",
  "/dashboard/landlord/billing/refund",
  "/dashboard/landlord/billing/subscription",
  "/dashboard/landlord/calculators",
  "/dashboard/landlord/compliance-guide",
  "/dashboard/landlord/compliance/alerts",
  "/dashboard/landlord/compliance/upload",
  "/dashboard/landlord/documents",
  "/dashboard/landlord/finance/report",
  "/dashboard/landlord/finance/tax",
  "/dashboard/landlord/find-tradespeople",
  "/dashboard/landlord/listings",
  "/dashboard/landlord/listings/new",
  "/dashboard/landlord/moving",
  "/dashboard/landlord/offers",
  "/dashboard/landlord/properties/add",
  "/dashboard/landlord/referrals",
  "/dashboard/landlord/saved",
  "/dashboard/landlord/searches",
  "/dashboard/landlord/services",
  "/dashboard/landlord/tenancy",
  "/dashboard/landlord/viewings",
  "/dashboard/landlord/viewings/book",
  // Provider — provider-specific sub-pages plus shared `[role]` tools, none in nav.
  "/dashboard/provider/ai-match",
  "/dashboard/provider/analytics",
  "/dashboard/provider/applications",
  "/dashboard/provider/billing",
  "/dashboard/provider/billing/checkout/one-time",
  "/dashboard/provider/billing/checkout/subscription",
  "/dashboard/provider/billing/confirmation",
  "/dashboard/provider/billing/failed",
  "/dashboard/provider/billing/invoices",
  "/dashboard/provider/billing/payment-methods",
  "/dashboard/provider/billing/refund",
  "/dashboard/provider/billing/subscription",
  "/dashboard/provider/calculators",
  "/dashboard/provider/documents",
  "/dashboard/provider/field",
  "/dashboard/provider/field/jobs",
  "/dashboard/provider/field/payments",
  "/dashboard/provider/jobs/active",
  "/dashboard/provider/jobs/completed",
  "/dashboard/provider/listings",
  "/dashboard/provider/listings/new",
  "/dashboard/provider/moving",
  "/dashboard/provider/offers",
  "/dashboard/provider/portfolio",
  "/dashboard/provider/profile",
  "/dashboard/provider/quotes",
  "/dashboard/provider/referrals",
  "/dashboard/provider/saved",
  "/dashboard/provider/searches",
  "/dashboard/provider/services",
  "/dashboard/provider/services/areas",
  "/dashboard/provider/tenancy",
  "/dashboard/provider/verification/badges",
  "/dashboard/provider/verification/client-references",
  "/dashboard/provider/verification/credentials",
  "/dashboard/provider/verification/peer-references",
  "/dashboard/provider/viewings",
  "/dashboard/provider/viewings/book",
  // Renter — shared `[role]` tools not wired into the renter nav.
  "/dashboard/renter/ai-match",
  "/dashboard/renter/billing",
  "/dashboard/renter/billing/checkout/one-time",
  "/dashboard/renter/billing/checkout/subscription",
  "/dashboard/renter/billing/confirmation",
  "/dashboard/renter/billing/failed",
  "/dashboard/renter/billing/invoices",
  "/dashboard/renter/billing/payment-methods",
  "/dashboard/renter/billing/refund",
  "/dashboard/renter/billing/subscription",
  "/dashboard/renter/calculators",
  "/dashboard/renter/listings",
  "/dashboard/renter/listings/new",
  "/dashboard/renter/moving",
  "/dashboard/renter/offers",
  "/dashboard/renter/referrals",
  "/dashboard/renter/searches",
  "/dashboard/renter/services",
  "/dashboard/renter/viewings",
  "/dashboard/renter/viewings/book",
  // Seller — seller-specific sub-pages plus shared `[role]` tools, none in nav.
  "/dashboard/seller/agents",
  "/dashboard/seller/agents/compare",
  "/dashboard/seller/ai-match",
  "/dashboard/seller/analytics",
  "/dashboard/seller/applications",
  "/dashboard/seller/billing",
  "/dashboard/seller/billing/checkout/one-time",
  "/dashboard/seller/billing/checkout/subscription",
  "/dashboard/seller/billing/confirmation",
  "/dashboard/seller/billing/failed",
  "/dashboard/seller/billing/invoices",
  "/dashboard/seller/billing/payment-methods",
  "/dashboard/seller/billing/refund",
  "/dashboard/seller/billing/subscription",
  "/dashboard/seller/calculators",
  "/dashboard/seller/enquiries",
  "/dashboard/seller/listings/create",
  "/dashboard/seller/listings/new",
  "/dashboard/seller/moving",
  "/dashboard/seller/referrals",
  "/dashboard/seller/saved",
  "/dashboard/seller/searches",
  "/dashboard/seller/services",
  "/dashboard/seller/tenancy",
  "/dashboard/seller/valuation",
  "/dashboard/seller/viewings/book",
];
