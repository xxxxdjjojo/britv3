import { describe, expect, it } from "vitest";

import {
  datedDeadlines,
  RRA_DEADLINES,
  RRA_DEADLINES_CHECKED_DATE,
  RRA_DEADLINES_VERSION,
} from "./index";

/**
 * Content guards for the Landlord Deadline Diary (same policy as
 * renters-rights-tree.test.ts): every entry cited, no fabricated dates —
 * dated entries must be real ISO dates, trigger entries must explain what
 * starts the clock.
 */
describe("RRA deadline diary content", () => {
  it("is versioned with a machine-readable checked date", () => {
    expect(RRA_DEADLINES_VERSION).toBeGreaterThanOrEqual(1);
    expect(RRA_DEADLINES_CHECKED_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has unique entry ids", () => {
    const ids = RRA_DEADLINES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry carries at least one citation", () => {
    for (const entry of RRA_DEADLINES) {
      expect(entry.citations.length, `${entry.id} has no citations`).toBeGreaterThan(0);
      for (const citation of entry.citations) {
        expect(citation.url, `${entry.id} citation missing url`).toMatch(/^https:\/\//);
      }
    }
  });

  it("cites the Renters' Rights Act 2025 as chapter 26 on legislation.gov.uk", () => {
    const urls = RRA_DEADLINES.flatMap((entry) =>
      entry.citations.map((citation) => citation.url),
    );
    expect(urls.some((url) => url.includes("legislation.gov.uk/ukpga/2025/26"))).toBe(
      true,
    );
    // The wrong-chapter claim a reviewer previously made — must never appear.
    expect(urls.some((url) => url.includes("ukpga/2025/15"))).toBe(false);
  });

  it("dated entries carry valid ISO dates; trigger entries explain the clock", () => {
    for (const entry of RRA_DEADLINES) {
      if (entry.kind === "dated") {
        expect(entry.date, `${entry.id} date not ISO`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(
          Number.isNaN(Date.parse(`${entry.date}T00:00:00Z`)),
          `${entry.id} date unparseable`,
        ).toBe(false);
      } else {
        expect(entry.trigger.length, `${entry.id} trigger too short`).toBeGreaterThan(
          20,
        );
      }
    }
  });

  it("entries with unpublished dates are trigger-rule, not guessed dates", () => {
    // The PRS database, ombudsman, Decent Homes, and Awaab's Law have no
    // published commencement dates — they must stay trigger-rule entries.
    for (const id of ["prs-database", "prs-ombudsman", "decent-homes", "awaabs-law"]) {
      const entry = RRA_DEADLINES.find((candidate) => candidate.id === id);
      expect(entry, `missing entry ${id}`).toBeDefined();
      expect(entry?.kind, `${id} must not carry a fabricated date`).toBe("trigger");
    }
  });

  it("datedDeadlines() returns only dated entries, ascending", () => {
    const dated = datedDeadlines();
    expect(dated.length).toBeGreaterThan(0);
    for (const entry of dated) expect(entry.kind).toBe("dated");
    const sorted = dated
      .map((entry) => entry.date)
      .slice()
      .sort();
    expect(dated.map((entry) => entry.date)).toEqual(sorted);
  });
});
