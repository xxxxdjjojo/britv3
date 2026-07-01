/**
 * Guard: every tradesperson-profile link resolves to a real route, and every
 * link site routes through the single-source-of-truth helper so the historical
 * link-drift bug (cards pointing at /services/tradespeople/[slug] while no such
 * route existed → 404) cannot recur.
 *
 * Root cause this guards against:
 *   Trader cards linked to `/services/tradespeople/${slug}` (1 segment) but the
 *   only on-disk route under tradespeople/ was `[category]/[location]` (2 segments),
 *   so clicking a trader 404'd — "no profile page". Others used a bare
 *   `/services/${slug}` (missing the category segment) which also 404'd.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { resolveAppRoute } from "../routes/route-manifest";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";

const SRC = path.join(process.cwd(), "src");

// Every component/page that renders a link to an individual tradesperson profile.
const LINK_SITES = [
  "components/placements/FeaturedExpertCard.tsx",
  "components/properties/detail/RecommendedTradespeople.tsx",
  "components/providers/ProviderSearchCard.tsx",
  "components/marketplace/ProviderCard.tsx",
  "components/services/TopRatedCarousel.tsx",
  "components/compare/CompareTable.tsx",
  "app/(main)/professionals/[town]/[category]/page.tsx",
  "app/(protected)/dashboard/landlord/find-tradespeople/page.tsx",
];

describe("tradesperson profile canonical route", () => {
  it("has an on-disk route at /services/tradespeople/[slug]", () => {
    const match = resolveAppRoute("/services/tradespeople/marcus-sterling");
    expect(match).not.toBeNull();
    expect(match).toContain("tradespeople");
    expect(match).toContain("[slug]");
  });

  it("keeps the legacy /services/[category]/[slug] profile route working (back-compat)", () => {
    expect(resolveAppRoute("/services/plumbers/marcus-sterling")).not.toBeNull();
  });
});

describe("tradespersonProfilePath helper", () => {
  it("builds the canonical path", () => {
    expect(tradespersonProfilePath("marcus-sterling")).toBe(
      "/services/tradespeople/marcus-sterling",
    );
  });

  it("supports an intent query param", () => {
    expect(tradespersonProfilePath("marcus-sterling", { intent: "quote" })).toBe(
      "/services/tradespeople/marcus-sterling?intent=quote",
    );
  });

  it("produces a path that resolves to a real route", () => {
    expect(resolveAppRoute(tradespersonProfilePath("any-provider"))).not.toBeNull();
  });
});

describe("no link site hand-rolls a trader profile URL", () => {
  it.each(LINK_SITES)("%s routes through tradespersonProfilePath", (rel) => {
    const source = readFileSync(path.join(SRC, rel), "utf8");
    expect(source).toContain("tradespersonProfilePath");
  });

  it.each(LINK_SITES)("%s has no broken single-segment /services/${slug} link", (rel) => {
    const source = readFileSync(path.join(SRC, rel), "utf8");
    // The historical bugs: `/services/${provider.slug}` and `/services/tradespeople/${x}`
    // built by hand. All profile links must now come from the helper.
    expect(source).not.toMatch(/`\/services\/\$\{[^}]*slug[^}]*}`/);
    expect(source).not.toMatch(/`\/services\/tradespeople\/\$\{/);
  });
});
