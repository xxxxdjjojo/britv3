import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Influence Strategy Phase 1 surface contract
 * (docs/INFLUENCE_STRATEGY_IMPLEMENTATION_PROMPT.md).
 *
 * Written FIRST (TDD): asserts every Phase-1 surface exists and is linked so
 * links render properly. Complements orphan-routes.test.ts (page → nav) and
 * configured-route-targets.test.ts (nav → page).
 */

const SRC = path.resolve(__dirname, "..", "..");
const APP = path.join(SRC, "app");
const MAIN = path.join(APP, "(main)");

const read = (p: string): string => (existsSync(p) ? readFileSync(p, "utf8") : "");

describe("Phase 1 routes exist", () => {
  const pages = [
    "tools/renters-rights-checker/page.tsx",
    "tools/portal-cost-calculator/page.tsx",
    "tools/true-equity-checker/page.tsx",
    "pledges/page.tsx",
    "pledges/no-premium-placement/page.tsx",
    "pledges/your-data-your-leads/page.tsx",
    "compliance/page.tsx",
    "agent-briefing/page.tsx",
    "agent-briefing/archive/[slug]/page.tsx",
  ];

  it.each(pages)("src/app/(main)/%s exists", (rel) => {
    expect(existsSync(path.join(MAIN, rel)), `missing route file: ${rel}`).toBe(true);
  });

  it("true-equity-checker is a redirect to /area-prices, not a duplicate surface", () => {
    const body = read(path.join(MAIN, "tools/true-equity-checker/page.tsx"));
    expect(body).toMatch(/redirect\(["']\/area-prices["']\)/);
  });
});

describe("Trust kit (src/components/trust/)", () => {
  const kit = [
    "NotLegalAdviceBanner.tsx",
    "ContentVersionStamp.tsx",
    "MethodologyFooter.tsx",
    "SourcedFigure.tsx",
    "ShareBar.tsx",
  ];

  it.each(kit)("components/trust/%s exists", (rel) => {
    expect(existsSync(path.join(SRC, "components", "trust", rel))).toBe(true);
  });

  it("SourcedFigure requires a source (url + label) so unsourced numbers are unrepresentable", () => {
    const body = read(path.join(SRC, "components", "trust", "SourcedFigure.tsx"));
    expect(body).toMatch(/source:\s*\{/);
    expect(body).toMatch(/url:\s*string/);
    expect(body).toMatch(/label:\s*string/);
    // must not be optional
    expect(body).not.toMatch(/source\?:/);
  });
});

describe("Newsletter audiences foundation", () => {
  it("has an audience migration", () => {
    const dir = path.join(SRC, "..", "supabase", "migrations");
    const hit = readdirSync(dir).some((f) => /newsletter.*audience|audience.*newsletter/i.test(f));
    expect(hit, "expected a supabase migration adding newsletter audiences").toBe(true);
  });

  it("newsletter service understands audiences", () => {
    const body = read(path.join(SRC, "services", "newsletter", "newsletter-service.ts"));
    expect(body).toContain("audience");
    expect(body).toContain("agent_briefing");
  });
});

describe("Renters' Rights Checker content", () => {
  it("versioned content tree exists under src/content/renters-rights/", () => {
    expect(existsSync(path.join(SRC, "content", "renters-rights"))).toBe(true);
  });

  it("checker page carries NotLegalAdviceBanner and ContentVersionStamp", () => {
    const dir = path.join(MAIN, "tools", "renters-rights-checker");
    const files = existsSync(dir) ? readdirSync(dir) : [];
    const all = files.map((f) => read(path.join(dir, f))).join("\n");
    expect(all).toContain("NotLegalAdviceBanner");
    expect(all).toContain("ContentVersionStamp");
  });
});

describe("Portal Cost Calculator (Decision Gate 4)", () => {
  it("assumptions config exists with sourced constants", () => {
    const body = read(path.join(SRC, "config", "portal-cost-assumptions.ts"));
    expect(body).toMatch(/source/i);
    expect(body).toMatch(/url/);
  });

  it("page is feature-flag gated (off = 404)", () => {
    const body = read(path.join(MAIN, "tools", "portal-cost-calculator", "page.tsx"));
    expect(body).toContain("portal_cost_calculator");
    expect(body).toContain("notFound");
  });
});

describe("Pledges + results-page disclosure (single source of copy)", () => {
  it("pledge copy config exists and the disclosure line comes from it", () => {
    const config = read(path.join(SRC, "config", "pledges.ts"));
    expect(config).toContain("no-premium-placement");
    const disclosure = read(
      path.join(SRC, "components", "search", "RankingDisclosure.tsx"),
    );
    expect(disclosure).toContain("@/config/pledges");
  });

  it("disclosure renders on /search and /search/map", () => {
    expect(read(path.join(MAIN, "search", "page.tsx"))).toContain("RankingDisclosure");
    expect(read(path.join(MAIN, "search", "map", "page.tsx"))).toContain("RankingDisclosure");
  });
});

describe("Your Data, Your Leads — CSV export", () => {
  it("export route exists", () => {
    expect(
      existsSync(path.join(APP, "api", "agent", "leads", "export", "route.ts")),
    ).toBe(true);
  });

  it("leads dashboard links the export", () => {
    const dir = path.join(APP, "(protected)", "dashboard", "agent", "leads");
    const files = existsSync(dir) ? readdirSync(dir, { recursive: true }) : [];
    const all = (files as string[])
      .filter((f) => f.toString().endsWith(".tsx"))
      .map((f) => read(path.join(dir, f.toString())))
      .join("\n");
    const components = read(
      path.join(SRC, "components", "dashboard", "agent", "leads", "LeadsExportButton.tsx"),
    );
    expect(all + components).toContain("/api/agent/leads/export");
  });
});

describe("Agent Briefing", () => {
  it("briefing content dir exists", () => {
    expect(existsSync(path.join(SRC, "content", "briefing"))).toBe(true);
  });
});

describe("Moving-cost stack (single SDLT source, portal passthrough)", () => {
  it("moving stack references portal-cost assumptions and billing tiers", () => {
    const dir = path.join(MAIN, "tools", "moving-cost-estimator");
    const lib = read(path.join(SRC, "lib", "calculators", "moving-stack.ts"));
    const files = existsSync(dir) ? readdirSync(dir) : [];
    const all = lib + files.map((f) => read(path.join(dir, f))).join("\n");
    expect(all).toContain("portal-cost-assumptions");
    expect(all).toContain("billing-config");
    expect(all).toContain("calculateSdlt");
  });
});

describe("OG image infra", () => {
  it("parameterised OG route exists", () => {
    expect(existsSync(path.join(APP, "api", "og", "[kind]", "route.tsx"))).toBe(true);
  });
});

describe("Navigation, sitemap and route gating", () => {
  const nav = read(path.join(SRC, "config", "navigation.ts"));
  const sitemap = read(path.join(APP, "sitemap.ts"));
  const constants = read(path.join(SRC, "lib", "constants.ts"));

  const publicSurfaces = ["/pledges", "/compliance", "/agent-briefing"];

  it.each(publicSurfaces)("%s is linked from nav/footer config", (href) => {
    expect(nav).toContain(href);
  });

  it.each(publicSurfaces)("%s is in the sitemap", (href) => {
    expect(sitemap).toContain(href);
  });

  it.each(publicSurfaces)("%s is a PUBLIC_ROUTE", (href) => {
    expect(constants).toContain(`"${href}"`);
  });

  it("new tools are linked from nav config", () => {
    expect(nav).toContain("/tools/renters-rights-checker");
  });

  it("new tools are in the sitemap", () => {
    expect(sitemap).toContain("/tools/renters-rights-checker");
  });
});

describe("KPI instrumentation", () => {
  it("influence analytics event helpers exist", () => {
    const body = read(path.join(SRC, "lib", "analytics", "influence-events.ts"));
    for (const evt of [
      "tool_started",
      "tool_completed",
      "tool_shared",
      "report_viewed",
      "briefing_subscribed",
      "pledge_viewed",
    ]) {
      expect(body, `missing KPI event ${evt}`).toContain(evt);
    }
  });

  it("signup captures signup_source attribution", () => {
    const dir = path.join(SRC, "lib", "analytics");
    const attribution = read(path.join(dir, "signup-attribution.ts"));
    expect(attribution).toContain("signup_source");
  });
});
