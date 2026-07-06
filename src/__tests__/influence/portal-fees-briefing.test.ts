import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";
import {
  ALL_SOURCES,
  BRIEFING_SECTIONS,
  PASSTHROUGH_ESTIMATES,
} from "@/content/portal-fees-briefing/briefing";

/**
 * Tribunal Data Pack (3.1) content guards — /press/portal-fees-briefing.
 *
 * Editorial red lines enforced here:
 * - every figure carries a real source URL (https, non-empty label);
 * - CAT/litigation-derived material always carries "alleges" language;
 * - the Rightmove ARPA and CAT-claim numbers are REUSED from
 *   portal-cost-assumptions.ts, never re-declared;
 * - passthrough numbers are pure arithmetic on the assumptions file.
 */

const SRC = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(SRC, "content", "portal-fees-briefing");
const PAGE_DIR = path.join(
  SRC,
  "app",
  "(main)",
  "press",
  "portal-fees-briefing",
);

const readDir = (dir: string): string =>
  readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");

describe("portal-fees-briefing content", () => {
  it("content dir and page dir exist", () => {
    expect(existsSync(CONTENT_DIR)).toBe(true);
    expect(existsSync(PAGE_DIR)).toBe(true);
  });

  it("every figure in every section has a real source (https URL + label)", () => {
    for (const section of BRIEFING_SECTIONS) {
      for (const figure of section.figures) {
        expect(figure.source, `${figure.id} is missing a source`).toBeDefined();
        expect(
          figure.source.url,
          `${figure.id} source URL must be https`,
        ).toMatch(/^https:\/\//);
        expect(
          figure.source.label.trim().length,
          `${figure.id} source label is empty`,
        ).toBeGreaterThan(0);
      }
      expect(
        section.sources.length,
        `section ${section.id} lists no sources`,
      ).toBeGreaterThan(0);
    }
  });

  it("prose paragraphs carry no bare money figures — figures render only via SourcedFigure cards", () => {
    for (const section of BRIEFING_SECTIONS) {
      for (const paragraph of section.paragraphs) {
        expect(
          /£\s?\d|SEK\s?\d|€\s?\d/.test(paragraph),
          `bare figure in prose (section ${section.id}): "${paragraph.slice(0, 80)}…"`,
        ).toBe(false);
      }
    }
  });

  it("alleges language accompanies every CAT/litigation mention (grep-style)", () => {
    const body = readDir(CONTENT_DIR);
    // The content must discuss the claim — and only with attribution language.
    expect(body).toMatch(/Competition Appeal Tribunal/);
    expect(body).toMatch(/alleg/i);

    // Paragraph-level guard: any paragraph mentioning the CAT/claim uses
    // "alleges"/"alleged"/"allegation" (or the procedural hearing framing
    // that asserts no wrongdoing).
    for (const section of BRIEFING_SECTIONS) {
      for (const paragraph of section.paragraphs) {
        if (/\bCAT\b|Competition Appeal Tribunal/i.test(paragraph)) {
          expect(
            /alleg/i.test(paragraph),
            `paragraph mentions the CAT without alleges language: "${paragraph.slice(0, 80)}…"`,
          ).toBe(true);
        }
      }
    }
  });

  it("every figure derived from the legal claim is flagged alleged", () => {
    const litigationFigures = BRIEFING_SECTIONS.flatMap((s) =>
      s.id === "litigation" ? s.figures : [],
    );
    expect(litigationFigures.length).toBeGreaterThan(0);
    for (const figure of litigationFigures) {
      expect(figure.alleged, `${figure.id} must be alleged: true`).toBe(true);
    }
  });

  it("reuses the assumptions-file constants instead of re-declaring them", () => {
    // The CAT claim figure and its source come straight from the config.
    const catFigure = BRIEFING_SECTIONS.flatMap((s) => s.figures).find(
      (f) => f.id === "cat-claim-alleged-value",
    );
    expect(catFigure?.source.url).toBe(
      PORTAL_COST_ASSUMPTIONS.catClaimAllegedValue.source.url,
    );

    // Passthrough estimates are arithmetic on the config values.
    expect(PASSTHROUGH_ESTIMATES.annualPortalCostPerBranchPounds).toBe(
      PORTAL_COST_ASSUMPTIONS.arpaMonthly.value * 12,
    );
    expect(PASSTHROUGH_ESTIMATES.portalCostPerListingPounds).toBe(
      Math.round(
        PORTAL_COST_ASSUMPTIONS.arpaMonthly.value /
          PORTAL_COST_ASSUMPTIONS.listingsPerBranchMonthly.value,
      ),
    );
  });

  it("sources footer covers every section source", () => {
    const footerUrls = new Set(ALL_SOURCES.map((s) => s.url));
    for (const section of BRIEFING_SECTIONS) {
      for (const source of section.sources) {
        expect(
          footerUrls.has(source.url),
          `footer is missing source ${source.url}`,
        ).toBe(true);
      }
    }
  });
});

describe("portal-fees-briefing page", () => {
  const pageSource = readDir(PAGE_DIR);

  it("renders figures through SourcedFigure", () => {
    expect(pageSource).toContain("SourcedFigure");
  });

  it("ships the print / save-as-PDF path (print CSS, not @react-pdf)", () => {
    expect(pageSource).toMatch(/window\.print\(\)/);
    expect(pageSource).toMatch(/@media print/);
    expect(pageSource).not.toMatch(/from\s+["']@react-pdf/);
  });

  it("carries an OG image via /api/og/", () => {
    expect(pageSource).toMatch(/api\/og\//);
  });

  it("fires the report_viewed KPI via ReportViewTracker", () => {
    expect(pageSource).toContain("ReportViewTracker");
  });
});
