/**
 * Portal Cost Calculator assumptions (Influence Strategy Phase 1, item 1.2).
 *
 * LEGAL FRAMING (non-negotiable):
 * - Every published figure carries a real, checkable source URL.
 * - Figures we could NOT source from a real publication are stated assumptions:
 *   they have NO `source`, carry an explicit `note`, and the UI renders them as
 *   editable inputs under "Our assumptions — edit them", never as sourced facts.
 * - Litigation-derived figures are `alleged: true` — the Competition Appeal
 *   Tribunal claim against Rightmove is ALLEGED, not proven. All UI copy about
 *   it must use "the claim alleges" language and link the source.
 * - The calculator output is always labelled "Estimate".
 */

export type AssumptionSource = { url: string; label: string };

export type PortalCostAssumption = {
  value: number;
  label: string;
  /**
   * Present only for figures with a real published source. Stated assumptions
   * omit it and explain themselves via `note` instead.
   */
  source?: AssumptionSource;
  note?: string;
  /** True when the figure derives from an unproven legal claim. */
  alleged?: boolean;
};

export const PORTAL_COST_METHODOLOGY_VERSION = 1;

export const PORTAL_COST_ASSUMPTIONS = {
  /**
   * Rightmove's published average revenue per advertiser (ARPA): £1,431 per
   * advertiser (branch) per month for the year ended 31 December 2023.
   */
  arpaMonthly: {
    value: 1431,
    label:
      "Rightmove average revenue per advertiser (ARPA), per branch per month, FY2023",
    source: {
      url: "https://plc.rightmove.co.uk/content/uploads/2024/02/23-FY-Analyst-Presentation_Updated-FINAL-1.pdf",
      label: "Rightmove plc FY2023 results",
    },
  },
  /**
   * How many sales a typical branch completes in a month. We could not find a
   * single authoritative published figure, so this is a stated assumption —
   * editable in the UI, never rendered as a sourced fact.
   */
  listingsPerBranchMonthly: {
    value: 10,
    label: "Listings handled per branch per month",
    note:
      "TrueDeed stated assumption, not a published statistic. Branch throughput varies widely — edit this figure above to match the agency you have in mind.",
  },
  /**
   * Typical UK sole-agency estate agent fee range: 1.2%–1.8% including VAT
   * (HomeOwners Alliance guidance; their 2026 reported average is 1.42% inc VAT).
   */
  commissionRateLow: {
    value: 0.012,
    label: "Typical sole-agency commission — low end (1.2% inc VAT)",
    source: {
      url: "https://hoa.org.uk/advice/guides-for-homeowners/i-am-selling/how-much-should-i-pay-the-estate-agent/",
      label: "HomeOwners Alliance — Estate Agent Fees guide",
    },
  },
  commissionRateHigh: {
    value: 0.018,
    label: "Typical sole-agency commission — high end (1.8% inc VAT)",
    source: {
      url: "https://hoa.org.uk/advice/guides-for-homeowners/i-am-selling/how-much-should-i-pay-the-estate-agent/",
      label: "HomeOwners Alliance — Estate Agent Fees guide",
    },
  },
  /**
   * ALLEGED, NOT PROVEN: a collective claim filed at the Competition Appeal
   * Tribunal by Jeremy Newman (a former CMA panel member) alleges Rightmove
   * abused a dominant position by charging estate agents and new-home
   * developers excessive and unfair subscription fees, seeking up to £1.5bn.
   * Rightmove denies the claim. UI copy must say "the claim alleges".
   */
  catClaimAllegedValue: {
    value: 1_500_000_000,
    label:
      "Value of the collective claim against Rightmove at the Competition Appeal Tribunal (alleged, unproven)",
    alleged: true,
    note:
      "The claim alleges overcharging; Rightmove denies it and nothing has been decided by the Tribunal.",
    source: {
      url: "https://scott-scott.com/1-5-billion-legal-action-filed-against-rightmove/",
      label: "Scott+Scott — claim announcement",
    },
  },
} as const satisfies Record<string, PortalCostAssumption>;

export type PortalCostAssumptionKey = keyof typeof PORTAL_COST_ASSUMPTIONS;
