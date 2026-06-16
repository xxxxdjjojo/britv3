import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  BREADCRUMB_MAP,
  BREADCRUMB_PATTERNS,
} from "@/config/navigation";
import type { BreadcrumbEntry } from "@/config/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

/**
 * Capitalize the first letter of each hyphen-separated word in a path segment.
 * e.g. "stamp-duty-calculator" → "Stamp Duty Calculator"
 */
function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Attempt to match a pathname against BREADCRUMB_PATTERNS.
 * Returns resolved breadcrumb entries or null if no match.
 */
function matchPattern(pathname: string): BreadcrumbEntry[] | null {
  const pathSegments = pathname.split("/").filter(Boolean);

  for (const [pattern, entries] of Object.entries(BREADCRUMB_PATTERNS)) {
    const patternSegments = pattern.split("/").filter(Boolean);

    if (patternSegments.length !== pathSegments.length) continue;

    const tokens: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < patternSegments.length; i++) {
      const ps = patternSegments[i];
      if (ps.startsWith("[") && ps.endsWith("]")) {
        const tokenName = ps.slice(1, -1);
        tokens[tokenName] = pathSegments[i];
      } else if (ps !== pathSegments[i]) {
        matched = false;
        break;
      }
    }

    if (!matched) continue;

    // Resolve tokens in entries
    return entries.map((entry) => {
      let label = entry.label;
      let href = entry.href;

      // Replace [token] in label
      const labelMatch = label.match(/^\[(\w+)\]$/);
      if (labelMatch) {
        const tokenName = labelMatch[1];
        const value = tokens[tokenName];
        label = value ? titleCase(value) : label;
      }

      // Replace [token] in href
      if (href) {
        href = href.replace(/\[(\w+)\]/g, (_, tokenName) => {
          return tokens[tokenName] ?? tokenName;
        });
      }

      return { label, href };
    });
  }

  return null;
}

/**
 * Build a fallback breadcrumb trail from URL path segments.
 * e.g. "/foo/bar" → [{ label: "Home", href: "/" }, { label: "Foo", href: "/foo" }, { label: "Bar" }]
 */
function buildFallbackTrail(pathname: string): BreadcrumbEntry[] {
  const segments = pathname.split("/").filter(Boolean);
  const trail: BreadcrumbEntry[] = [{ label: "Home", href: "/" }];

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const href = isLast ? undefined : "/" + segments.slice(0, index + 1).join("/");
    trail.push({ label: titleCase(segment), href });
  });

  return trail;
}

/**
 * Resolve the breadcrumb trail for a given pathname.
 */
function resolveBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  // 1. Try exact match in BREADCRUMB_MAP (includes query string)
  if (BREADCRUMB_MAP[pathname]) {
    return BREADCRUMB_MAP[pathname];
  }

  // 2. Try pattern matching for dynamic routes
  const pathnameWithoutQuery = pathname.split("?")[0];
  const patternMatch = matchPattern(pathnameWithoutQuery);
  if (patternMatch) {
    return patternMatch;
  }

  // 3. Fallback: generate from path segments
  return buildFallbackTrail(pathnameWithoutQuery);
}

/**
 * Build BreadcrumbList JSON-LD structured data.
 */
function buildJsonLd(trail: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => {
      const element: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: entry.label,
      };

      // Only add item URL if not the last (current page)
      if (entry.href) {
        element.item = `${BASE_URL}${entry.href}`;
      }

      return element;
    }),
  };
}

/**
 * Breadcrumbs — Server Component for breadcrumb navigation with JSON-LD.
 *
 * Renders a breadcrumb trail using Shadcn breadcrumb components and emits
 * BreadcrumbList JSON-LD structured data for SEO.
 */
export function Breadcrumbs(
  props: Readonly<{ pathname: string }>
) {
  const { pathname } = props;

  // Return null on homepage
  if (pathname === "/") return null;

  // Return null for dashboard/authenticated routes
  if (pathname.startsWith("/dashboard")) return null;

  // Return null for map pages that render their own inner breadcrumb nav
  if (pathname === "/search/map") return null;
  if (pathname.startsWith("/search/market-map")) return null;

  const trail = resolveBreadcrumbs(pathname);
  const jsonLd = buildJsonLd(trail);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb className="overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <BreadcrumbList className="flex-nowrap">
          {trail.map((entry, index) => {
            const isLast = index === trail.length - 1;
            return (
              <span key={entry.label + index} className="contents">
                <BreadcrumbItem className="shrink-0">
                  {isLast ? (
                    <BreadcrumbPage>{entry.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={
                        <Link href={entry.href ?? "#"} />
                      }
                    >
                      {entry.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="shrink-0" />}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
