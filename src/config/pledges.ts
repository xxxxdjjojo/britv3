/**
 * Single source of truth for the public pledges (/pledges).
 *
 * Every pledge page renders from this config so the published wording can
 * never drift from what the codebase actually enforces. Scope note
 * (deliberate): the no-premium-placement pledge covers PROPERTY SEARCH RESULT
 * RANKING only — sponsored content exists on the platform as separately
 * labelled slots (see SponsoredSearchSlot), and the pledge wording must not
 * claim otherwise. The margin pledge carries NO numbers anywhere in its copy
 * until the founder confirms the capped figure with the first annual figures.
 */

export type PledgeChangelogEntry = { date: string; change: string };

export type Pledge = {
  slug: string;
  title: string;
  oneSentence: string;
  whatItBindsUsTo: ReadonlyArray<string>;
  howToVerify: ReadonlyArray<string>;
  changelog: ReadonlyArray<PledgeChangelogEntry>;
  status: "live" | "in_preparation";
};

/**
 * The exact one-line disclosure rendered on every property results page.
 * Guarded by src/__tests__/search/ranking-no-paid-input.test.ts.
 */
export const SEARCH_RANKING_DISCLOSURE =
  "Results ranked by relevance and freshness. Placement here cannot be bought.";

export const PLEDGES: ReadonlyArray<Pledge> = [
  {
    slug: "no-premium-placement",
    title: "No premium placement",
    oneSentence:
      "Property search results on TrueDeed are never sold — they are ranked by relevance and freshness only.",
    whatItBindsUsTo: [
      "No paid input of any kind in property-search result ranking. The sort order is price, listing date, or text relevance — never who paid us.",
      "Sponsored content always appears as a separate, clearly labelled slot. It never changes the order of the property results themselves.",
      "This page changes visibly. Any edit to this pledge is recorded in the dated changelog below, so it cannot be quietly weakened.",
    ],
    howToVerify: [
      "The disclosure line on every results page: “Results ranked by relevance and freshness. Placement here cannot be bought.”",
      "The public regression test in our codebase — src/__tests__/search/ranking-no-paid-input.test.ts — which fails our build if paid signals ever touch the ranking code.",
      "The dated changelog on this page.",
    ],
    changelog: [{ date: "2026-07-02", change: "Pledge published." }],
    status: "live",
  },
  {
    slug: "your-data-your-leads",
    title: "Your data, your leads",
    oneSentence:
      "Agents own the lead data they generate on TrueDeed — export all of it, any time, and we never sell it to anyone.",
    whatItBindsUsTo: [
      "Your leads are your data. Every lead an agent generates on TrueDeed belongs to that agent, not to us.",
      "One-click CSV export of everything, any time, from your leads dashboard — no support ticket, no notice period, no export fee.",
      "We never sell agent leads to third parties.",
      "This page changes visibly. Any edit to this pledge is recorded in the dated changelog below.",
    ],
    howToVerify: [
      "The export button in your leads dashboard at /dashboard/agent/leads — press it and you get the full CSV immediately.",
      "The dated changelog on this page.",
    ],
    changelog: [{ date: "2026-07-02", change: "Pledge published." }],
    status: "live",
  },
  {
    slug: "margin-pledge",
    title: "The margin pledge",
    oneSentence:
      "We will publish a hard cap on the share TrueDeed takes — alongside our first annual figures, so the number arrives with the accounts that prove it.",
    whatItBindsUsTo: [
      "Publishing a capped take rate when our first annual figures are prepared — not before, because a pledge without audited numbers is marketing.",
      "Never publishing a figure we cannot evidence.",
      "Recording every change in a dated changelog from the day the pledge goes live.",
    ],
    howToVerify: [
      "This page will carry the capped figure, the supporting annual figures, and a dated changelog when the pledge is published.",
    ],
    changelog: [],
    status: "in_preparation",
  },
];

export function getPledge(slug: string): Pledge | undefined {
  return PLEDGES.find((p) => p.slug === slug);
}
