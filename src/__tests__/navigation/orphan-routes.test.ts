import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMMAND_PALETTE_ROUTES,
  FOOTER_LINKS,
  NAV_ITEMS,
} from "../../config/navigation";

/**
 * Orphan-route guard (inverse of configured-route-targets).
 *
 * configured-route-targets asserts every nav href points at a real route.
 * This asserts the reverse: every *public* `(main)` page is reachable from the
 * header nav, footer, or command palette — OR is explicitly allowlisted as a
 * route reached contextually (legal hub, detail pages, hub-linked sub-pages).
 *
 * This is the test that would have caught the market-map: a route that existed
 * but had no link anywhere on the site ("there is nowhere to see it").
 *
 * When you add a new public page, either link it from nav/footer/command
 * palette, or add it to ORPHAN_ALLOWLIST with a one-line reason.
 */

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src/app");

/** Public routes that are intentionally not in the top nav. Keep reasons. */
const ORPHAN_ALLOWLIST = new Set<string>([
  // Legal pages — reached via the /legal hub + LegalPageShell left-nav (guarded
  // by its own internal-links / canonical-link-targets tests).
  "/legal/acceptable-use",
  "/legal/accessibility",
  "/legal/ai-transparency",
  "/legal/aml-policy",
  "/legal/complaints",
  "/legal/cookies",
  "/legal/data-processing",
  "/legal/disclaimer",
  "/legal/fee-transparency",
  "/legal/gdpr-rights",
  "/legal/modern-slavery",
  "/legal/privacy",
  "/legal/professional-standards",
  "/legal/refunds",
  "/legal/review-policy",
  "/legal/terms",
  "/legal/third-party-services",
  // Hub-linked sub-pages reached from their parent hub, not the global nav.
  "/help/contact", // linked from /help
  "/market-trends/national", // redirect stub → /area-prices (route file retained so the 308 fires)
  "/services/architects", // linked from /services
  "/services/conveyancers",
  "/services/mortgage-brokers",
  "/services/surveyors",
  "/services/tradespeople",
  // Utility / SEO pages reached via footer, sitemap, or direct entry.
  "/sitemap-page",
  "/post-a-job",
  "/jobs",
  "/partners",
  "/press",
  "/careers",
  "/investors",
  "/contact",
  "/about",
  "/how-it-works",
  // Hub landing pages — their nav items are dropdown roots without a direct
  // link; reached via breadcrumbs / footer / direct entry.
  "/services",
  "/tools",
  // Value-My-Property wizard steps — reached by progressing through the flow
  // from the linked entry point (/value-my-property), not via global nav.
  "/value-my-property/address",
  "/value-my-property/details",
  "/value-my-property/review",
  "/value-my-property/verify-email",
]);

function listPageFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const absolutePath = join(dir, entry);
    if (statSync(absolutePath).isDirectory()) {
      files.push(...listPageFiles(absolutePath));
    } else if (entry === "page.tsx") {
      files.push(absolutePath);
    }
  }
  return files;
}

function pageFileToRoutePattern(filePath: string): string {
  const relativePath = relative(APP_DIR, filePath).replace(/\/page\.tsx$/, "");
  const routeSegments = relativePath
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("("));
  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

function normalizeHrefPath(href: string): string {
  const url = new URL(href, "https://britestate.test");
  const normalized = url.pathname.replace(/\/$/, "");
  return normalized === "" ? "/" : normalized;
}

function collectLinkedPaths(): Set<string> {
  const hrefs: string[] = [
    ...NAV_ITEMS.flatMap((item) => [
      ...(item.href ? [item.href] : []),
      ...(item.sections?.flatMap((section) =>
        section.links.map((link) => link.href),
      ) ?? []),
    ]),
    ...FOOTER_LINKS.flatMap((column) => column.links?.map((l) => l.href) ?? []),
    ...COMMAND_PALETTE_ROUTES.map((route) => route.href),
  ];
  return new Set(
    hrefs
      .filter((href) => href.startsWith("/") && !href.startsWith("//"))
      .map(normalizeHrefPath),
  );
}

describe("public route reachability", () => {
  it("links every public (main) page from nav, footer, or command palette", () => {
    const linked = collectLinkedPaths();

    const publicStaticRoutes = listPageFiles(APP_DIR)
      .filter((file) => file.includes(`${"/(main)/"}`))
      .map(pageFileToRoutePattern)
      // Dynamic detail routes ([slug], [area], ...) are reached from listings.
      .filter((route) => !route.includes("["))
      // The home route is always reachable.
      .filter((route) => route !== "/");

    const orphans = publicStaticRoutes
      .filter((route) => !linked.has(route))
      .filter((route) => !ORPHAN_ALLOWLIST.has(route));

    expect(orphans).toEqual([]);
  });
});
