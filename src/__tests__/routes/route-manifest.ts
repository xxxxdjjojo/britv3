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
import { ROLE_TO_ROUTE } from "@/lib/constants";
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

  const role = ROLE_TO_ROLE_FROM_SLUG[seg];
  return role ?? "shared";
}

/** URL slug → app role (e.g. provider → service_provider). */
const ROLE_TO_ROLE_FROM_SLUG: Readonly<Record<string, AppRole>> = Object.entries(
  ROLE_TO_ROUTE,
).reduce<Record<string, AppRole>>((acc, [slug, role]) => {
  acc[slug] = role;
  return acc;
}, {});

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
  const base = dashboardPathForRole(role); // e.g. /dashboard/provider
  const slug = ROLE_TO_ROUTE[role]; // e.g. provider
  const literalPrefix = `/dashboard/${slug}`;
  const result = new Set<string>();

  for (const entry of getDashboardRoutes()) {
    if (entry.dynamic) continue;

    // Routes physically under the role's literal directory.
    if (
      entry.urlPath === literalPrefix ||
      entry.urlPath.startsWith(`${literalPrefix}/`)
    ) {
      result.add(entry.urlPath);
      continue;
    }

    // Generic `[role]` routes expanded to this role's base.
    if (entry.role === "[role]") {
      const generic = entry.urlPath.replace("/dashboard/[role]", base);
      result.add(generic);
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
  // Agent — most sub-pages are reached from in-page tabs, not the sidebar.
  "/dashboard/agent/analytics",
  "/dashboard/agent/analytics/branch",
  "/dashboard/agent/analytics/competitors",
  "/dashboard/agent/billing",
  "/dashboard/agent/billing/boost",
  "/dashboard/agent/billing/truedeed",
  "/dashboard/agent/crm",
  "/dashboard/agent/integrations",
  "/dashboard/agent/integrations/feeds",
  "/dashboard/agent/introductions",
  "/dashboard/agent/listings/archived",
  "/dashboard/agent/listings/create",
  "/dashboard/agent/listings/sold",
  "/dashboard/agent/offers",
  "/dashboard/agent/profile",
  "/dashboard/agent/profile/branding",
  "/dashboard/agent/reviews",
  "/dashboard/agent/sales",
  "/dashboard/agent/sales/appraisal",
  "/dashboard/agent/sales/reports",
  "/dashboard/agent/team/branches",
  "/dashboard/agent/team/roles",
  "/dashboard/agent/viewings/feedback",
  // Broker — sub-pages reached from in-page tabs, not the sidebar.
  "/dashboard/broker/billing",
  "/dashboard/broker/calculators",
  "/dashboard/broker/profile",
  "/dashboard/broker/reviews",
  // Landlord — deep tools/sub-pages not in the sidebar.
  "/dashboard/landlord/compliance-guide",
  "/dashboard/landlord/compliance/alerts",
  "/dashboard/landlord/compliance/upload",
  "/dashboard/landlord/finance/report",
  "/dashboard/landlord/finance/tax",
  "/dashboard/landlord/find-tradespeople",
  "/dashboard/landlord/properties/add",
  // Provider — sub-pages reached from in-page tabs, not the bottom tabs.
  "/dashboard/provider/analytics",
  "/dashboard/provider/billing",
  "/dashboard/provider/boost",
  "/dashboard/provider/documents",
  "/dashboard/provider/field",
  "/dashboard/provider/field/jobs",
  "/dashboard/provider/field/payments",
  "/dashboard/provider/jobs/active",
  "/dashboard/provider/jobs/completed",
  "/dashboard/provider/portfolio",
  "/dashboard/provider/profile",
  "/dashboard/provider/quotes",
  "/dashboard/provider/referrals",
  "/dashboard/provider/services",
  "/dashboard/provider/services/areas",
  "/dashboard/provider/verification/badges",
  "/dashboard/provider/verification/client-references",
  "/dashboard/provider/verification/credentials",
  "/dashboard/provider/verification/peer-references",
  // Seller — sub-pages reached from in-page tabs, not the bottom tabs.
  "/dashboard/seller/agents",
  "/dashboard/seller/agents/compare",
  "/dashboard/seller/analytics",
  "/dashboard/seller/enquiries",
  "/dashboard/seller/listings/create",
  "/dashboard/seller/valuation",
];
