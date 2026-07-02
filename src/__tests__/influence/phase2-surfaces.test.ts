import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Influence Strategy Phase 2 surface contract
 * (docs/INFLUENCE_STRATEGY_IMPLEMENTATION_PROMPT.md — "own the data narrative").
 *
 * Written FIRST (TDD): asserts every Phase-2 surface exists and is wired.
 * Complements phase1-surfaces.test.ts and the navigation guard tests.
 */

const SRC = path.resolve(__dirname, "..", "..");
const ROOT = path.resolve(SRC, "..");
const APP = path.join(SRC, "app");
const MAIN = path.join(APP, "(main)");

const read = (p: string): string => (existsSync(p) ? readFileSync(p, "utf8") : "");

describe("Phase 2 routes exist", () => {
  const pages = [
    "reports/page.tsx",
    "reports/reality-gap/page.tsx",
    "reports/reality-gap/league/page.tsx",
    "reports/reality-gap/methodology/page.tsx",
    "reports/time-to-sell/page.tsx",
    "reports/time-to-sell/methodology/page.tsx",
    "metrics/page.tsx",
  ];

  it.each(pages)("src/app/(main)/%s exists", (rel) => {
    expect(existsSync(path.join(MAIN, rel)), `missing route file: ${rel}`).toBe(true);
  });

  it("admin data-wire page exists", () => {
    expect(existsSync(path.join(APP, "(admin)", "admin", "data-wire", "page.tsx"))).toBe(true);
  });
});

describe("Reports scaffold", () => {
  const kit = ["ReportShell.tsx", "EditionSwitcher.tsx", "EmbargoGate.tsx"];

  it.each(kit)("components/reports/%s exists", (rel) => {
    expect(existsSync(path.join(SRC, "components", "reports", rel))).toBe(true);
  });

  it("embargo preview token lib follows the HMAC pattern", () => {
    const body = read(path.join(SRC, "lib", "reports", "embargo-token.ts"));
    expect(body).toContain("createHmac");
    expect(body).toContain("timingSafeEqual");
    expect(body).toContain("report-embargo");
  });
});

describe("Migrations", () => {
  const dir = path.join(ROOT, "supabase", "migrations");
  const files = existsSync(dir) ? readdirSync(dir) : [];

  it.each(["reality_gap", "platform_metrics", "uptime"])(
    "a migration exists for %s",
    (frag) => {
      expect(
        files.some((f) => f.includes(frag)),
        `no migration filename contains "${frag}"`,
      ).toBe(true);
    },
  );
});

describe("Services (pure build* split from async get*)", () => {
  it("reality-gap service exists with pure builder + suppression", () => {
    const body = read(path.join(SRC, "services", "reports", "reality-gap-service.ts"));
    expect(body).toMatch(/export function build/);
    expect(body).toMatch(/sample_n|sampleN/);
  });

  it("time-to-sell service exists with pure builder", () => {
    const body = read(path.join(SRC, "services", "reports", "time-to-sell-service.ts"));
    expect(body).toMatch(/export function build/);
  });

  it("platform metrics service exists", () => {
    expect(
      existsSync(path.join(SRC, "services", "metrics", "platform-metrics-service.ts")),
    ).toBe(true);
  });
});

describe("Background jobs", () => {
  const inngestRoute = read(path.join(APP, "api", "inngest", "route.ts"));

  it("report snapshots Inngest function exists and is registered", () => {
    expect(
      existsSync(path.join(SRC, "inngest", "functions", "truedeed-report-snapshots.ts")),
    ).toBe(true);
    expect(inngestRoute).toContain("ReportSnapshots");
  });

  it("platform metrics daily Inngest function exists and is registered", () => {
    expect(
      existsSync(path.join(SRC, "inngest", "functions", "platform-metrics-daily.ts")),
    ).toBe(true);
    expect(inngestRoute).toContain("platformMetricsDaily");
  });

  it("uptime ping workflow exists", () => {
    expect(existsSync(path.join(ROOT, ".github", "workflows", "uptime-ping.yml"))).toBe(true);
  });

  it("public health endpoint exists", () => {
    expect(existsSync(path.join(APP, "api", "health", "route.ts"))).toBe(true);
  });
});

describe("Report page requirements", () => {
  it("reality-gap page carries Dataset JSON-LD, methodology link and CSV download", () => {
    const dir = path.join(MAIN, "reports", "reality-gap");
    const files = existsSync(dir) ? (readdirSync(dir) as string[]) : [];
    const all = files
      .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
      .map((f) => read(path.join(dir, f)))
      .join("\n");
    expect(all).toContain("Dataset");
    expect(all).toContain("methodology");
    expect(all).toContain("csv");
  });

  it("reality-gap CSV endpoint exists", () => {
    expect(
      existsSync(path.join(APP, "api", "reports", "reality-gap", "csv", "route.ts")),
    ).toBe(true);
  });

  it("the two-tier rule is explicit: matched-pair and area-median tiers never blend", () => {
    const body = read(path.join(SRC, "services", "reports", "reality-gap-service.ts"));
    expect(body).toContain("matched_pair");
    expect(body).toContain("area_median");
  });

  it("metrics page versions its definitions", () => {
    const body = read(path.join(MAIN, "metrics", "page.tsx"));
    expect(body.toLowerCase()).toContain("definition");
    expect(body).toMatch(/METRIC_DEFINITIONS_VERSION|definitionsVersion/);
  });
});

describe("Street report card (2.3)", () => {
  it("printable report card component exists and area-prices renders it", () => {
    const card = path.join(MAIN, "area-prices", "StreetReportCard.tsx");
    expect(existsSync(card)).toBe(true);
    expect(read(path.join(MAIN, "area-prices", "AreaPricesExplorer.tsx"))).toContain(
      "StreetReportCard",
    );
  });
});

describe("Data wire (2.6)", () => {
  it("templates dir + audited pack endpoint exist", () => {
    expect(existsSync(path.join(SRC, "content", "data-wire"))).toBe(true);
    const route = read(path.join(APP, "api", "admin", "data-wire", "pack", "route.ts"));
    expect(route).toContain("auditedAdminAction");
  });
});

describe("OG kinds for Phase 2", () => {
  it("og-props supports league and report cards", () => {
    const body = read(path.join(SRC, "lib", "og", "og-props.ts"));
    expect(body).toContain('"league"');
    expect(body).toContain('"report"');
  });
});

describe("Navigation, sitemap and route gating", () => {
  const nav = read(path.join(SRC, "config", "navigation.ts"));
  const sitemap = read(path.join(APP, "sitemap.ts"));
  const constants = read(path.join(SRC, "lib", "constants.ts"));

  it.each(["/reports/reality-gap", "/metrics"])("%s is linked from nav config", (href) => {
    expect(nav).toContain(href);
  });

  it.each(["/reports/reality-gap", "/reports/time-to-sell", "/metrics"])(
    "%s is in the sitemap",
    (href) => {
      expect(sitemap).toContain(href);
    },
  );

  it.each(["/reports", "/metrics"])("%s is a PUBLIC_ROUTE", (href) => {
    expect(constants).toContain(`"${href}"`);
  });
});
