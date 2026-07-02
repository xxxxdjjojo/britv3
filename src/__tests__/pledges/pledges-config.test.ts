import { describe, expect, it } from "vitest";

import {
  PLEDGES,
  SEARCH_RANKING_DISCLOSURE,
  getPledge,
} from "@/config/pledges";

describe("pledges config (single source of pledge copy)", () => {
  it("exposes the exact results-page disclosure line", () => {
    expect(SEARCH_RANKING_DISCLOSURE).toBe(
      "Results ranked by relevance and freshness. Placement here cannot be bought.",
    );
  });

  it("contains exactly the expected slugs and statuses", () => {
    expect(PLEDGES.map((p) => [p.slug, p.status])).toEqual([
      ["no-premium-placement", "live"],
      ["your-data-your-leads", "live"],
      ["margin-pledge", "in_preparation"],
    ]);
  });

  describe("live pledges are complete", () => {
    const live = PLEDGES.filter((p) => p.status === "live");

    it.each(live.map((p) => [p.slug, p] as const))(
      "%s has binds-us-to, verify and dated changelog entries",
      (_slug, pledge) => {
        expect(pledge.oneSentence.length).toBeGreaterThan(0);
        expect(pledge.whatItBindsUsTo.length).toBeGreaterThan(0);
        expect(pledge.howToVerify.length).toBeGreaterThan(0);
        expect(pledge.changelog.length).toBeGreaterThan(0);
        for (const entry of pledge.changelog) {
          expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(entry.change.length).toBeGreaterThan(0);
        }
      },
    );

    it("no-premium-placement names its public regression test file", () => {
      const pledge = getPledge("no-premium-placement");
      expect(pledge?.howToVerify.join("\n")).toContain(
        "src/__tests__/search/ranking-no-paid-input.test.ts",
      );
    });

    it("no-premium-placement is scoped to property search, not all placements", () => {
      const pledge = getPledge("no-premium-placement");
      const copy = [
        pledge?.oneSentence,
        ...(pledge?.whatItBindsUsTo ?? []),
      ].join("\n");
      // Must acknowledge sponsored content exists as labelled slots (Gate 1:
      // wording must not be broader than what the code enforces).
      expect(copy.toLowerCase()).toContain("sponsored");
      expect(copy.toLowerCase()).toContain("label");
    });
  });

  describe("margin pledge (Gate 2: no numbers until founder confirms)", () => {
    const margin = getPledge("margin-pledge");

    it("exists in preparation with an empty changelog", () => {
      expect(margin?.status).toBe("in_preparation");
      expect(margin?.changelog).toEqual([]);
    });

    it("contains NO digits anywhere in its copy", () => {
      const copy = [
        margin?.title,
        margin?.oneSentence,
        ...(margin?.whatItBindsUsTo ?? []),
        ...(margin?.howToVerify ?? []),
        ...(margin?.changelog ?? []).map((c) => `${c.date} ${c.change}`),
      ].join("\n");
      expect(copy).not.toMatch(/\d/);
    });
  });
});
