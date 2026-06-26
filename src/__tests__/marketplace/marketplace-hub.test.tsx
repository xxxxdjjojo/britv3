import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CATEGORIES } from "@/app/(main)/marketplace/categories";
import type { FeaturedProvider } from "@/app/(main)/marketplace/featured-providers";

// ---------------------------------------------------------------------------
// Mock the data layer (per setup.ts conventions). The page is an async Server
// Component, so we stub the featured-provider query and render its output.
// ---------------------------------------------------------------------------
const getFeaturedProvidersMock = vi.fn<() => Promise<FeaturedProvider[]>>();

vi.mock("@/app/(main)/marketplace/featured-providers", () => ({
  getFeaturedProviders: () => getFeaturedProvidersMock(),
}));

import MarketplaceLandingPage from "@/app/(main)/marketplace/page";

const SAMPLE_PROVIDERS: FeaturedProvider[] = [
  {
    providerId: "p1",
    slug: "acme-plumbing",
    businessName: "Acme Plumbing Ltd",
    displayName: "Jane Plumber",
    city: "Manchester",
    services: ["plumber"],
    avatarUrl: null,
    isVerified: true,
    averageRating: 4.8,
    totalReviews: 42,
  },
  {
    providerId: "p2",
    slug: "bright-sparks",
    businessName: "Bright Sparks Electrical",
    displayName: null,
    city: "Leeds",
    services: ["electrician"],
    avatarUrl: null,
    isVerified: false,
    averageRating: 4.6,
    totalReviews: 18,
  },
];

async function renderPage(): Promise<void> {
  // Await the async Server Component to its element tree, then render.
  const ui = await MarketplaceLandingPage();
  render(ui);
}

// ---------------------------------------------------------------------------
// Build the set of implemented app routes once, to assert link integrity.
// Mirrors configured-route-targets.test.ts.
// ---------------------------------------------------------------------------
const APP_DIR = join(process.cwd(), "src/app");

function listPageFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      files.push(...listPageFiles(abs));
    } else if (entry === "page.tsx") {
      files.push(abs);
    }
  }
  return files;
}

function pageFileToRoutePattern(filePath: string): string {
  const segments = relative(APP_DIR, filePath)
    .replace(/\/page\.tsx$/, "")
    .split("/")
    .filter(Boolean)
    .filter((s) => !s.startsWith("("));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function normalizePath(href: string): string {
  const url = new URL(href, "https://truedeed.test");
  const p = url.pathname.replace(/\/$/, "");
  return p === "" ? "/" : p;
}

function routeMatches(pattern: string, path: string): boolean {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((seg, i) =>
    seg.startsWith("[") && seg.endsWith("]") ? b[i].length > 0 : seg === b[i],
  );
}

const ROUTE_PATTERNS = listPageFiles(APP_DIR).map(pageFileToRoutePattern);

function resolves(href: string): boolean {
  if (!href.startsWith("/")) return false; // external/anchor — out of scope here
  const path = normalizePath(href);
  return ROUTE_PATTERNS.some((pattern) => routeMatches(pattern, path));
}

describe("Marketplace hub landing", () => {
  it("renders the hero with a search form and a post-a-job CTA", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /find a tradesperson/i }),
    ).toBeInTheDocument();

    const search = screen.getByRole("search", { name: /search professionals/i });
    expect(within(search).getByRole("textbox")).toBeInTheDocument();
    expect(within(search).getByRole("button", { name: /search/i })).toBeInTheDocument();

    const postLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/post-a-job");
    expect(postLinks.length).toBeGreaterThan(0);
  });

  it("renders every real category with a resolvable link target", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    for (const category of CATEGORIES) {
      const link = screen.getByRole("link", { name: new RegExp(category.label, "i") });
      expect(link).toHaveAttribute("href", category.href);
      expect(resolves(category.href)).toBe(true);
    }
  });

  it("renders featured providers with their real names, ratings and review counts", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    expect(screen.getByText("Jane Plumber")).toBeInTheDocument();
    // displayName null → falls back to business name
    expect(screen.getByText("Bright Sparks Electrical")).toBeInTheDocument();

    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText(/42 reviews/)).toBeInTheDocument();

    const providerLink = screen.getByRole("link", { name: /Jane Plumber/i });
    expect(providerLink).toHaveAttribute("href", "/services/plumber/acme-plumbing");
    expect(resolves("/services/plumber/acme-plumbing")).toBe(true);
  });

  it("gracefully omits the featured section when no providers qualify", async () => {
    getFeaturedProvidersMock.mockResolvedValue([]);
    await renderPage();

    expect(screen.queryByText(/top-rated this week/i)).not.toBeInTheDocument();
    // The rest of the page still renders.
    expect(
      screen.getByRole("heading", { level: 1, name: /find a tradesperson/i }),
    ).toBeInTheDocument();
  });

  it("points all primary CTAs at implemented routes", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    const ctaHrefs = [
      "/post-a-job",
      "/services",
      "/register?professional=service_provider",
      "/dashboard/provider/jobs/leads",
    ];
    for (const href of ctaHrefs) {
      expect(resolves(href), `${href} should resolve to a real route`).toBe(true);
    }
  });
});
