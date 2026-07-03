import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Influence Strategy Phase 3 surface contract
 * (docs/INFLUENCE_STRATEGY_PHASE3_4_PROMPT.md — the tribunal window and the
 * landlord beachhead, Oct–Dec 2026).
 *
 * Written FIRST (TDD): asserts every Phase-3 surface exists and is wired.
 * Complements phase1-surfaces.test.ts / phase2-surfaces.test.ts and the
 * navigation guard tests.
 */

const SRC = path.resolve(__dirname, "..", "..");
const ROOT = path.resolve(SRC, "..");
const APP = path.join(SRC, "app");
const MAIN = path.join(APP, "(main)");

const read = (p: string): string => (existsSync(p) ? readFileSync(p, "utf8") : "");

const readDirDeep = (dir: string): string => {
  if (!existsSync(dir)) return "";
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map((f) => read(path.join(dir, f)))
    .join("\n");
};

describe("Phase 3 routes exist", () => {
  const pages = [
    "press/portal-fees-briefing/page.tsx",
    "reports/portal-cost-passthrough/page.tsx",
    "reports/portal-cost-passthrough/methodology/page.tsx",
    "landlords/deadline-diary/page.tsx",
    "landlords/clinics/page.tsx",
    "fair-landlord-register/page.tsx",
    "awards/page.tsx",
    "awards/methodology/page.tsx",
  ];

  it.each(pages)("src/app/(main)/%s exists", (rel) => {
    expect(existsSync(path.join(MAIN, rel)), `missing route file: ${rel}`).toBe(true);
  });
});

describe("Migrations", () => {
  const dir = path.join(ROOT, "supabase", "migrations");
  const files = existsSync(dir) ? readdirSync(dir) : [];

  it.each([
    "portal_cost_passthrough_flag",
    "landlord_diary_profiles",
    "fair_landlord_pledges",
    "agent_award",
  ])("a migration exists for %s", (frag) => {
    expect(
      files.some((f) => f.includes(frag)),
      `no migration filename contains "${frag}"`,
    ).toBe(true);
  });

  it("phase-3 migration files are non-empty (0-byte subagent hazard)", () => {
    const frags = [
      "portal_cost_passthrough_flag",
      "landlord_diary_profiles",
      "fair_landlord_pledges",
      "agent_award",
    ];
    for (const frag of frags) {
      const f = files.find((name) => name.includes(frag));
      if (!f) continue; // existence asserted above
      expect(
        readFileSync(path.join(dir, f), "utf8").trim().length,
        `${f} is empty`,
      ).toBeGreaterThan(100);
    }
  });
});

describe("3.1 Tribunal Data Pack (/press/portal-fees-briefing)", () => {
  const pageDir = path.join(MAIN, "press", "portal-fees-briefing");
  const contentDir = path.join(SRC, "content", "portal-fees-briefing");

  it("typed content file exists", () => {
    expect(existsSync(contentDir)).toBe(true);
  });

  it("every CAT/litigation-derived figure carries alleges language", () => {
    const body = readDirDeep(contentDir);
    // The CAT claim may only appear with attribution language.
    if (/\bCAT\b|Competition Appeal Tribunal/i.test(body)) {
      expect(body).toMatch(/alleg/i);
    }
    expect(body.length).toBeGreaterThan(0);
  });

  it("page renders sourced figures and a print/download path", () => {
    const all = readDirDeep(pageDir);
    expect(all).toContain("SourcedFigure");
    expect(all).toMatch(/print|Pdf|PDF/);
  });

  it("page carries an OG image", () => {
    const all = readDirDeep(pageDir);
    expect(all).toMatch(/api\/og\//);
  });
});

describe("3.1a Passthrough Study (/reports/portal-cost-passthrough) — flag-dark", () => {
  const pageDir = path.join(MAIN, "reports", "portal-cost-passthrough");

  it("results content file exists and is typed (question/n/method)", () => {
    const body = read(path.join(SRC, "content", "passthrough-study", "results.ts"));
    expect(body).toMatch(/question/i);
    expect(body).toMatch(/method/i);
  });

  it("page is gated on the portal_cost_passthrough flag and 404s when off", () => {
    const all = readDirDeep(pageDir);
    expect(all).toContain("portal_cost_passthrough");
    expect(all).toContain("notFound");
  });

  it("page emits Dataset JSON-LD and supports EmbargoGate", () => {
    const all = readDirDeep(pageDir);
    expect(all).toContain("Dataset");
    expect(all).toContain("EmbargoGate");
  });
});

describe("3.2 Landlord Deadline Diary (/landlords/deadline-diary)", () => {
  it("versioned RRA deadlines content exists with statutory citations", () => {
    const body = readDirDeep(path.join(SRC, "content", "rra-deadlines"));
    expect(body).toMatch(/legislation\.gov\.uk/);
    expect(body.length).toBeGreaterThan(0);
  });

  it("ics calendar endpoint exists (HMAC token)", () => {
    expect(
      existsSync(
        path.join(
          APP,
          "api",
          "landlords",
          "deadline-diary",
          "[token]",
          "calendar.ics",
          "route.ts",
        ),
      ),
    ).toBe(true);
  });

  it("deadline drip Inngest function exists", () => {
    expect(
      existsSync(path.join(SRC, "inngest", "functions", "landlord-deadline-diary.ts")),
    ).toBe(true);
  });

  it("page carries the rights banner + content version stamp", () => {
    const all = readDirDeep(path.join(MAIN, "landlords", "deadline-diary"));
    expect(all).toContain("NotLegalAdviceBanner");
    expect(all).toContain("ContentVersionStamp");
  });

  it("profile capture targets the landlord_diary audience", () => {
    const all = readDirDeep(path.join(MAIN, "landlords", "deadline-diary"));
    expect(all).toContain("landlord_diary");
  });
});

describe("3.3 Landlord Transition Clinics (/landlords/clinics)", () => {
  it("clinics content files exist", () => {
    expect(existsSync(path.join(SRC, "content", "clinics"))).toBe(true);
  });

  it("page renders FAQPage JSON-LD", () => {
    const all = readDirDeep(path.join(MAIN, "landlords", "clinics"));
    expect(all).toContain("FAQPage");
  });
});

describe("3.4 Fair Landlord Register (/fair-landlord-register)", () => {
  it('charter says verbatim "a pledge, not a vetting service"', () => {
    const body = readDirDeep(path.join(SRC, "content", "fair-landlord-register"));
    expect(body).toContain("a pledge, not a vetting service");
  });

  it("pledge migration gates public reads on published status", () => {
    const dir = path.join(ROOT, "supabase", "migrations");
    const files = existsSync(dir) ? readdirSync(dir) : [];
    const f = files.find((name) => name.includes("fair_landlord_pledges"));
    const body = f ? read(path.join(dir, f)) : "";
    expect(body).toContain("row level security");
    expect(body).toMatch(/status\s*=\s*'published'/);
  });

  it("signup/revoke API route exists", () => {
    expect(
      existsSync(path.join(APP, "api", "landlords", "fair-landlord-pledge", "route.ts")),
    ).toBe(true);
  });
});

describe("3.5 Honest Agent Awards (/awards)", () => {
  const scoringPath = path.join(SRC, "services", "awards", "award-scoring-service.ts");

  it("scoring service exists with pure builders + disclosed min-sample suppression", () => {
    const body = read(scoringPath);
    expect(body).toMatch(/export function build/);
    expect(body).toMatch(/MIN_SAMPLE|minSample/);
  });

  it("fall-through metric is explicitly dropped for year 1 (thin coverage)", () => {
    const all =
      read(scoringPath) + readDirDeep(path.join(MAIN, "awards", "methodology"));
    expect(all).toMatch(/fall[- ]through/i);
  });

  it("no payment code path anywhere in the awards module", () => {
    const surfaces =
      readDirDeep(path.join(MAIN, "awards")) +
      readDirDeep(path.join(SRC, "services", "awards")) +
      readDirDeep(path.join(APP, "api", "awards"));
    expect(surfaces).not.toMatch(/stripe|payment_intent|checkout/i);
  });

  it("never ranks on votes", () => {
    const body = read(scoringPath);
    expect(body).not.toMatch(/votes?_count|vote_total/i);
  });

  it("agent dashboard standing panel exists", () => {
    const all = readDirDeep(path.join(APP, "(protected)", "dashboard", "agent"));
    expect(all).toMatch(/AwardStanding|award-standing/);
  });
});

describe("3.6 Boxing Day automation", () => {
  const fnPath = path.join(SRC, "inngest", "functions", "boxing-day-annual-push.ts");

  it("function exists with the 26 Dec cron", () => {
    const body = read(fnPath);
    expect(body).toContain("0 6 26 12 *");
    expect(body).toContain("truedeed/report-snapshots.refresh-requested");
  });
});

describe("Background job registration", () => {
  const inngestRoute = read(path.join(APP, "api", "inngest", "route.ts"));

  it("deadline diary drip is registered", () => {
    expect(inngestRoute).toMatch(/landlordDeadlineDiary|deadline-diary/);
  });

  it("boxing day push is registered", () => {
    expect(inngestRoute).toMatch(/boxingDay/i);
  });
});

describe("Navigation, sitemap and route gating", () => {
  const nav = read(path.join(SRC, "config", "navigation.ts"));
  const sitemap = read(path.join(APP, "sitemap.ts"));
  const constants = read(path.join(SRC, "lib", "constants.ts"));

  it.each(["/landlords/deadline-diary", "/fair-landlord-register", "/awards"])(
    "%s is linked from nav config",
    (href) => {
      expect(nav).toContain(href);
    },
  );

  it.each([
    "/press/portal-fees-briefing",
    "/landlords/deadline-diary",
    "/landlords/clinics",
    "/fair-landlord-register",
    "/awards",
  ])("%s is in the sitemap", (href) => {
    expect(sitemap).toContain(href);
  });

  it("flag-dark passthrough study is NOT in the sitemap while Gate 4 is pending", () => {
    expect(sitemap).not.toContain("/reports/portal-cost-passthrough");
  });

  it.each(["/landlords", "/fair-landlord-register", "/awards"])(
    "%s is a PUBLIC_ROUTE",
    (href) => {
      expect(constants).toContain(`"${href}"`);
    },
  );
});
