/**
 * Dashboard link-integrity contract.
 *
 * The existing route-contract test validates the *navigation config*
 * (ROLE_NAV_ITEMS / TAB_CONFIG). It does NOT see hrefs hard-coded inside
 * dashboard page/component source — and those are exactly the links a user
 * clicks from a card, quick-action, or detail view. When one of those points
 * at a route that does not exist, Next.js serves a 404 with no compile-time or
 * lint warning.
 *
 * This test closes that gap: it statically extracts every internal href and
 * client-navigation target (`href=`, `href:`, `<Link href>`, `router.push`,
 * `router.replace`, `redirect`) from the dashboard surface and asserts each one
 * resolves to a real page via the same App Router matcher Next.js uses
 * (literal segment preferred, then `[param]`/`[role]`, route groups
 * transparent — see resolveAppRoute).
 *
 * Pure filesystem reads — no server, no Supabase.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAppRoute } from "./route-manifest";

const SRC_ROOT = path.resolve(__dirname, "../..");

/** Source trees whose hard-coded links we hold to the no-404 contract. */
const SCAN_DIRS = [
  path.join(SRC_ROOT, "app/(protected)/dashboard"),
  path.join(SRC_ROOT, "components/dashboard"),
];

/** Internal app sections a dashboard link may legitimately target. */
const INTERNAL_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/notifications",
  "/profile",
  "/settings",
  "/search",
  "/areas",
  "/area-prices",
  "/tools",
  "/legal",
  "/pricing",
  "/marketplace",
  "/valuation",
  "/value-my-property",
  "/sold-prices",
  "/market-trends",
  "/services",
  "/services-near",
  "/agents",
  "/help",
  "/contact",
  "/about",
  "/blog",
  "/how-it-works",
  "/fee-transparency",
  "/post-a-job",
  "/sellers",
  "/developers",
  "/traders",
  "/renter-tools",
  "/mortgage-brokers",
  "/conveyancers",
  "/surveyors",
  "/architects",
  "/careers",
  "/press",
  "/reviews",
];

/**
 * Collect every `.ts`/`.tsx` source file under a directory, excluding tests and
 * storybook stories (those carry intentional fixture hrefs like `/foo`).
 */
function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.test\.[tj]sx?$/.test(entry.name) &&
      !/\.stories\.[tj]sx?$/.test(entry.name)
    ) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Extract internal navigation targets from a source file: `href` props/keys and
 * imperative `router.push`/`router.replace`/`redirect` calls. Targeted on the
 * navigation context so unrelated path-shaped strings (e.g. a `/analytics`
 * suffix in a concatenated href, or an `/api/...` fetch) are not captured.
 */
function extractHrefs(src: string): string[] {
  const out: string[] = [];
  const patterns = [
    // href="...", href={"..."}, href={`...`}, href: "..."
    /\bhref\s*[:=]\s*\{?\s*[`"']([^`"']+)[`"']/g,
    // router.push("..."), router.replace(`...`), redirect("...")
    /\b(?:router\.(?:push|replace)|redirect)\(\s*[`"']([^`"']+)[`"']/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) out.push(m[1]);
  }
  // Also catch full `/dashboard/...` string literals stored outside an href=
  // context (e.g. a STEP_LINKS map whose values are later passed to <Link>).
  // A literal ending in `/` is a concatenation prefix (`"…/listings/" + id`),
  // not a real destination — skip those to avoid false positives.
  const literalRe = /[`"'](\/dashboard\/[^`"'\s]+)[`"']/g;
  let lm: RegExpExecArray | null;
  while ((lm = literalRe.exec(src))) {
    if (!lm[1].endsWith("/")) out.push(lm[1]);
  }
  return out;
}

/**
 * Normalise a raw href into a resolvable URL path:
 *  - drop query/hash
 *  - replace `${...}` template vars and `[...]` dynamic markers with a single
 *    placeholder segment, which the matcher resolves against `[param]`/`[role]`
 *  - strip trailing slash
 * Returns null for non-internal or non-static-resolvable hrefs.
 */
function toResolvablePath(raw: string): string | null {
  let href = raw.split("?")[0].split("#")[0];
  if (!href.startsWith("/")) return null; // external / mailto / tel / relative
  if (href.startsWith("/api") || href.startsWith("/_next")) return null;
  href = href.replace(/\$\{[^}]*\}/g, "_p_").replace(/\[[^\]]*\]/g, "_p_");
  // A leftover backtick expression we could not normalise — skip (can't assert).
  if (href.includes("${") || href.includes("`")) return null;
  href = href.replace(/\/+$/, "") || "/";
  const isInternal = INTERNAL_PREFIXES.some(
    (p) => href === p || href.startsWith(`${p}/`),
  );
  return isInternal ? href : null;
}

/**
 * The dashboard surface that each role actually renders at its dashboard URL.
 * Each must surface a Messages entry point linking to `/inbox` (Task 6) so a
 * user lands in the inbox from any dashboard.
 *
 * Note: homebuyer/renter resolve via the `[role]` dynamic page (which renders
 * the role component), while seller/landlord/agent/provider have a *literal*
 * `dashboard/<role>/page.tsx` that overrides `[role]` — so the live surface is
 * the literal page (or the component it renders), not the `[role]` component.
 * The contract must hold for whatever the user actually sees.
 */
const ROLE_DASHBOARD_SURFACES: ReadonlyArray<readonly [string, string]> = [
  ["homebuyer", "components/dashboard/homebuyer/HomebuyerDashboard.tsx"],
  ["renter", "components/dashboard/renter/RenterDashboard.tsx"],
  ["seller", "app/(protected)/dashboard/seller/page.tsx"],
  ["landlord", "app/(protected)/dashboard/landlord/page.tsx"],
  ["agent", "components/dashboard/agent/AgentDashboardHome.tsx"],
  ["provider", "app/(protected)/dashboard/provider/page.tsx"],
];

/** Does a source file declare an href to `/inbox` (the canonical inbox route)? */
function linksToInbox(src: string): boolean {
  // href="/inbox", href={"/inbox"}, href: "/inbox", or via the shared
  // DashboardMessagesLink component (which hard-codes the /inbox target).
  for (const raw of extractHrefs(src)) {
    const urlPath = toResolvablePath(raw);
    if (urlPath === "/inbox") return true;
  }
  return /\bDashboardMessagesLink\b/.test(src);
}

describe("dashboard messages entry point", () => {
  it.each(ROLE_DASHBOARD_SURFACES)(
    "the %s dashboard links to /inbox",
    (_role, relPath) => {
      const src = readFileSync(path.join(SRC_ROOT, relPath), "utf8");
      expect(
        linksToInbox(src),
        `${relPath} has no Messages link to /inbox — every dashboard must surface the inbox`,
      ).toBe(true);
    },
  );

  it("/inbox is a real route", () => {
    expect(resolveAppRoute("/inbox")).not.toBeNull();
  });
});

describe("landlord compliance and maintenance action links", () => {
  it("landlord compliance action destinations resolve to concrete compliance pages", () => {
    const expectedRoutes = [
      "/dashboard/landlord/compliance",
      "/dashboard/landlord/compliance/alerts",
      "/dashboard/landlord/compliance/matrix",
      "/dashboard/landlord/compliance/upload",
    ];

    for (const href of expectedRoutes) {
      const resolved = resolveAppRoute(href);
      expect(resolved, `${href} should resolve to a landlord compliance page`).toContain(
        `${path.sep}landlord${path.sep}compliance${path.sep}`,
      );
      expect(resolved, `${href} should not resolve through a dynamic catch-all`).not.toContain(
        `${path.sep}[`,
      );
    }
  });

  it("the portfolio maintenance New Request link resolves to a real create page", () => {
    const src = readFileSync(
      path.join(
        SRC_ROOT,
        "app/(protected)/dashboard/landlord/maintenance/MaintenanceInboxClient.tsx",
      ),
      "utf8",
    );

    expect(extractHrefs(src)).toContain("/dashboard/landlord/maintenance/new");

    const resolved = resolveAppRoute("/dashboard/landlord/maintenance/new");
    expect(
      resolved,
      "/dashboard/landlord/maintenance/new must not be handled as maintenance/[id]",
    ).toContain(
      `${path.sep}landlord${path.sep}maintenance${path.sep}new${path.sep}page.tsx`,
    );
  });
});

describe("dashboard link integrity", () => {
  it("every hard-coded dashboard href resolves to a real route", () => {
    const files = SCAN_DIRS.flatMap((d) => collectSourceFiles(d));
    expect(files.length).toBeGreaterThan(50);

    const broken = new Map<string, Set<string>>();
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const raw of extractHrefs(src)) {
        const urlPath = toResolvablePath(raw);
        if (!urlPath) continue;
        if (resolveAppRoute(urlPath)) continue;
        if (!broken.has(urlPath)) broken.set(urlPath, new Set());
        broken.get(urlPath)!.add(path.relative(SRC_ROOT, file));
      }
    }

    const report = [...broken.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([href, srcs]) => `  ${href}\n      ← ${[...srcs].sort().join(", ")}`)
      .join("\n");

    expect(
      broken.size,
      `Dashboard links pointing at non-existent routes (each 404s when clicked):\n${report}`,
    ).toBe(0);
  });
});
