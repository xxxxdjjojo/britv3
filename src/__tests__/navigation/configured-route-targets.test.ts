import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMMAND_PALETTE_ROUTES,
  FOOTER_LINKS,
  NAV_ITEMS,
  ROLE_NAV_ITEMS,
  TAB_CONFIG,
} from "../../config/navigation";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src/app");

type ConfiguredHref = Readonly<{
  href: string;
  label: string;
  source: string;
}>;

function listPageFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(dir, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listPageFiles(absolutePath));
      continue;
    }

    if (entry === "page.tsx") {
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

function routeMatchesPath(routePattern: string, path: string): boolean {
  const routeSegments = routePattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return false;
  }

  return routeSegments.every((segment, index) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return pathSegments[index].length > 0;
    }

    return segment === pathSegments[index];
  });
}

function collectConfiguredHrefs(): ConfiguredHref[] {
  return [
    ...NAV_ITEMS.flatMap((item) =>
      item.sections?.flatMap((section) =>
        section.links.map((link) => ({
          href: link.href,
          label: link.label,
          source: `NAV_ITEMS > ${item.label} > ${section.heading}`,
        })),
      ) ?? (item.href
        ? [{ href: item.href, label: item.label, source: "NAV_ITEMS" }]
        : []),
    ),
    ...FOOTER_LINKS.flatMap((column) =>
      column.links?.map((link) => ({
        href: link.href,
        label: link.label,
        source: `FOOTER_LINKS > ${column.heading}`,
      })) ?? [],
    ),
    ...Object.entries(ROLE_NAV_ITEMS).flatMap(([role, items]) =>
      items.map((item) => ({
        href: item.href,
        label: item.label,
        source: `ROLE_NAV_ITEMS > ${role}`,
      })),
    ),
    ...Object.entries(TAB_CONFIG).flatMap(([role, tabs]) =>
      tabs.map((tab) => ({
        href: tab.href,
        label: tab.label,
        source: `TAB_CONFIG > ${role}`,
      })),
    ),
    ...COMMAND_PALETTE_ROUTES.map((route) => ({
      href: route.href,
      label: route.label,
      source: `COMMAND_PALETTE_ROUTES > ${route.section}`,
    })),
  ];
}

describe("configured navigation route targets", () => {
  it("points every configured internal href at an implemented app route", () => {
    const routePatterns = listPageFiles(APP_DIR).map(pageFileToRoutePattern);
    const missingRoutes = collectConfiguredHrefs()
      .filter(({ href }) => href.startsWith("/") && !href.startsWith("//"))
      .map((link) => ({ ...link, path: normalizeHrefPath(link.href) }))
      .filter(
        ({ path }) =>
          !routePatterns.some((routePattern) =>
            routeMatchesPath(routePattern, path),
          ),
      )
      .map(
        ({ source, label, href }) =>
          `${source} > ${label} links to ${href}, but no src/app/**/page.tsx route matches it`,
      );

    expect(missingRoutes).toEqual([]);
  });
});
