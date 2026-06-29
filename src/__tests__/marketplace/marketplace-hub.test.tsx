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
  it("renders the hero with a dual search (service + postcode), a Search Pros button and trust badges", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /trusted tradespeople/i }),
    ).toBeInTheDocument();

    const search = screen.getByRole("search", { name: /search professionals/i });
    // Dual search: a "what service" input + a "postcode" input.
    expect(
      within(search).getByPlaceholderText(/what service do you need/i),
    ).toBeInTheDocument();
    expect(
      within(search).getByPlaceholderText(/postcode/i),
    ).toBeInTheDocument();
    expect(
      within(search).getByRole("button", { name: /search pros/i }),
    ).toBeInTheDocument();

    // No-JS friendly GET form whose named params a real route can read.
    const form = search.closest("form");
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("method", "get");
    const action = form?.getAttribute("action") ?? "";
    expect(resolves(action)).toBe(true);
    expect(within(search).getByRole("textbox", { name: /service/i })).toHaveAttribute(
      "name",
      "q",
    );
  });

  it("renders the Popular Categories grid where every real category resolves, plus a Browse All tile", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    expect(
      screen.getByRole("heading", { name: /popular categories/i }),
    ).toBeInTheDocument();

    for (const category of CATEGORIES) {
      const link = screen.getByRole("link", { name: new RegExp(category.label, "i") });
      expect(link).toHaveAttribute("href", category.href);
      expect(resolves(category.href)).toBe(true);
    }

    const browseAll = screen.getByRole("link", { name: /all .*services/i });
    expect(resolves(browseAll.getAttribute("href") ?? "")).toBe(true);
  });

  it("renders the three Why-Choose reasons with a Post a Job CTA", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    expect(
      screen.getByRole("heading", { name: /why choose/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/vetted & verified/i)).toBeInTheDocument();
    expect(screen.getByText(/real reviews only/i)).toBeInTheDocument();
    expect(screen.getByText(/satisfaction guarantee/i)).toBeInTheDocument();

    const postLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/post-a-job");
    expect(postLinks.length).toBeGreaterThan(0);
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
      screen.getByRole("heading", { level: 1, name: /trusted tradespeople/i }),
    ).toBeInTheDocument();
  });

  it("points all primary CTAs at implemented routes", async () => {
    getFeaturedProvidersMock.mockResolvedValue(SAMPLE_PROVIDERS);
    await renderPage();

    const ctaHrefs = [
      "/post-a-job",
      "/services",
      "/services/tradespeople",
      "/register?professional=service_provider",
    ];
    for (const href of ctaHrefs) {
      expect(resolves(href), `${href} should resolve to a real route`).toBe(true);
    }
  });
});
