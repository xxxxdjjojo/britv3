import {
  PORTAL_COST_ASSUMPTIONS,
  type AssumptionSource,
} from "@/config/portal-cost-assumptions";
import { formatGbpAmount } from "@/lib/format-money";

/**
 * Tribunal Data Pack — typed, cited content for /press/portal-fees-briefing
 * (Influence Strategy Phase 3, item 3.1 / Campaign 30).
 *
 * EDITORIAL RULES (non-negotiable, enforced by
 * src/__tests__/influence/portal-fees-briefing.test.ts):
 * - Every figure carries a real, checkable published source URL. A figure we
 *   could not trace to a real publication DOES NOT APPEAR — the international
 *   section is deliberately short for exactly that reason.
 * - Published per-branch figures (Rightmove ARPA FY2023, commission range,
 *   the CAT claim value) are REUSED from src/config/portal-cost-assumptions.ts
 *   — never re-declared here.
 * - The Competition Appeal Tribunal claim against Rightmove is ALLEGED, not
 *   proven. Every mention uses "the claim alleges" language with a linked
 *   source. Nothing here asserts wrongdoing as fact.
 * - Passthrough numbers computed from the stated assumption
 *   (listings per branch) are labelled "Estimate", never presented as facts.
 */

export type BriefingSource = AssumptionSource;

export type BriefingFigure = {
  id: string;
  /** Rendered value, e.g. "£1,431 / branch / month". */
  display: string;
  label: string;
  /** REQUIRED — no figure ships without a real published source. */
  source: BriefingSource;
  /** True when the figure derives from an unproven legal claim. */
  alleged?: boolean;
  note?: string;
};

export type BriefingSection = {
  id: string;
  heading: string;
  paragraphs: ReadonlyArray<string>;
  figures: ReadonlyArray<BriefingFigure>;
  sources: ReadonlyArray<BriefingSource>;
};

export const BRIEFING_TITLE = "UK portal fees: a briefing for journalists";
export const BRIEFING_DESCRIPTION =
  "What UK estate agents pay property portals, how those fees have grown since 2009, how they compare internationally, and what the Competition Appeal Tribunal claim against Rightmove alleges — every figure sourced.";
export const BRIEFING_PREPARED_DATE = "3 July 2026";
export const BRIEFING_PREPARED_DATE_ISO = "2026-07-03";
export const CAT_HEARING_DATES = "2–3 November 2026";
export const CAT_HEARING_DATES_ISO = "2026-11-02/2026-11-03";

/* ------------------------------------------------------------------ */
/* Sources (each verified against the linked publication)              */
/* ------------------------------------------------------------------ */

const RM_ANNUAL_REPORT_2010: BriefingSource = {
  url: "https://www.annualreports.com/HostedData/AnnualReportArchive/r/LSE_RMV_2010.pdf",
  label: "Rightmove plc Annual Report 2010",
};

const RM_FY2025_RNS: BriefingSource = {
  url: "https://plc.rightmove.co.uk/content/uploads/2026/02/Rightmove-RNS-27.02.26.pdf",
  label: "Rightmove plc FY2025 results (RNS, 27 Feb 2026)",
};

const OTM_FY2023_RESULTS: BriefingSource = {
  url: "https://www.sharesmagazine.co.uk/news/market/LSE20230710070004_4829455/full-year-results-to-31-january-2023",
  label: "OnTheMarket plc FY2023 results (year ended 31 Jan 2023)",
};

const HEMNET_Q4_2023: BriefingSource = {
  url: "https://www.hemnetgroup.se/en/investors/financial-reports/hemnet-group-interim-report-q4-2023/",
  label: "Hemnet Group interim report Q4 2023",
};

const SCOUT24_FY2023: BriefingSource = {
  url: "https://www.scout24.com/en/news-media/news/detail/scout24-ends-fy2023-with-14-revenue-growth-and-21-ooebitda-growth-resulting-in-60-margin-expecting-continued-growth-and-operating-leverage-in-2024",
  label: "Scout24 SE FY2023 results announcement",
};

const CAT_HEARING_PROPERTYWIRE: BriefingSource = {
  url: "https://www.propertywire.com/news/rightmove-faces-1-5bn-court-hearing-in-november/",
  label: "PropertyWire — Rightmove faces £1.5bn court hearing in November",
};

const CAT_CLAIM_TODAYS_CONVEYANCER: BriefingSource = {
  url: "https://todaysconveyancer.co.uk/rightmove-face-1-5bn-class-action-agents-claim-portal-overcharged-services/",
  label:
    "Today's Conveyancer — Rightmove faces £1.5bn class action as agents claim portal has overcharged for services",
};

/* ------------------------------------------------------------------ */
/* Reused constants — never re-declared (portal-cost-assumptions.ts)   */
/* ------------------------------------------------------------------ */

const ARPA_FY2023 = PORTAL_COST_ASSUMPTIONS.arpaMonthly;
const LISTINGS_PER_BRANCH = PORTAL_COST_ASSUMPTIONS.listingsPerBranchMonthly;
const COMMISSION_LOW = PORTAL_COST_ASSUMPTIONS.commissionRateLow;
const COMMISSION_HIGH = PORTAL_COST_ASSUMPTIONS.commissionRateHigh;
const CAT_CLAIM = PORTAL_COST_ASSUMPTIONS.catClaimAllegedValue;

/* ------------------------------------------------------------------ */
/* Section 1 — history of UK portal fees                               */
/* ------------------------------------------------------------------ */

const FEE_HISTORY: BriefingSection = {
  id: "fee-history",
  heading: "How UK portal fees have grown",
  paragraphs: [
    "Rightmove was founded in 2000 and listed on the London Stock Exchange in 2006; it is a FTSE 100 company and describes itself as the UK's largest property portal. Its own headline pricing metric is average revenue per advertiser (ARPA): revenue from agency and new-homes advertisers in a given month divided by the number of advertisers, averaged over the year. Because Rightmove publishes ARPA in every set of results, it is the cleanest public record of what a typical member branch pays.",
    "The published trajectory below runs from 2009 to FY2025 — roughly a five-fold increase over sixteen years. Rightmove attributes recent growth predominantly to product uptake rather than price rises; the figures are its own reported numbers either way, each linked to the publication it appears in.",
  ],
  figures: [
    {
      id: "arpa-2009",
      display: `${formatGbpAmount(308)} / month`,
      label: "Rightmove ARPA, 2009",
      source: RM_ANNUAL_REPORT_2010,
    },
    {
      id: "arpa-2010",
      display: `${formatGbpAmount(379)} / month`,
      label: "Rightmove ARPA, 2010",
      source: RM_ANNUAL_REPORT_2010,
    },
    {
      id: "arpa-fy2023",
      display: `${formatGbpAmount(ARPA_FY2023.value)} / month`,
      label: ARPA_FY2023.label,
      source: ARPA_FY2023.source,
    },
    {
      id: "arpa-total-2025",
      display: `${formatGbpAmount(1_621)} / month`,
      label: "Rightmove total ARPA (Agency + New Homes), FY2025",
      source: RM_FY2025_RNS,
    },
  ],
  sources: [RM_ANNUAL_REPORT_2010, ARPA_FY2023.source, RM_FY2025_RNS],
};

/* ------------------------------------------------------------------ */
/* Section 2 — published per-branch figures today                      */
/* ------------------------------------------------------------------ */

const PER_BRANCH: BriefingSection = {
  id: "per-branch",
  heading: "What agents pay per branch: the published figures",
  paragraphs: [
    "These are portal-published averages, not rate cards: actual bills vary by package, branch count and negotiation. Rightmove's FY2025 results break out what the average agency branch pays per month and how many branches pay it. For contrast, the challenger portal OnTheMarket — in its last full year as a listed company before the CoStar acquisition — reported a per-agent average several times lower than Rightmove's in the overlapping period. The published figures:",
  ],
  figures: [
    {
      id: "arpa-agency-2025",
      display: `${formatGbpAmount(1_530)} / branch / month`,
      label: "Rightmove agency ARPA, FY2025 (FY2024: £1,440)",
      source: RM_FY2025_RNS,
    },
    {
      id: "agency-branches-2025",
      display: "16,385 branches",
      label: "Rightmove agency membership, 31 December 2025",
      source: RM_FY2025_RNS,
    },
    {
      id: "otm-arpa-fy2023",
      display: `${formatGbpAmount(210)} / month`,
      label: "OnTheMarket ARPA, year ended 31 January 2023",
      source: OTM_FY2023_RESULTS,
    },
  ],
  sources: [RM_FY2025_RNS, OTM_FY2023_RESULTS],
};

/* ------------------------------------------------------------------ */
/* Section 3 — international comparison (short by design)              */
/* ------------------------------------------------------------------ */

const INTERNATIONAL: BriefingSection = {
  id: "international",
  heading: "International comparison",
  paragraphs: [
    "Direct international comparison is harder than it looks, because portals report different unit metrics: Rightmove charges agents per branch, while Sweden's Hemnet earns most of its listing revenue from sellers per published listing. Sourced figures only — this section is deliberately short because we publish nothing we cannot trace to a real publication.",
    "Hemnet (Sweden's dominant portal) earns its listing revenue per published listing, paid largely by the seller once per sale rather than by the agent every month; its published 2023 average is below. Germany's Scout24 (ImmoScout24) reports professional-customer ARPU growth and customer counts but does not disclose an absolute monthly figure in its results announcement, so we quote none.",
  ],
  figures: [
    {
      id: "hemnet-arpl-2023",
      display: "SEK 4,490 / published listing",
      label:
        "Hemnet average revenue per published listing (ARPL), 2023 (2022: SEK 3,275)",
      source: HEMNET_Q4_2023,
      note: "Per-listing, largely seller-paid — a different model from Rightmove's per-branch agent subscription.",
    },
    {
      id: "scout24-arpu-growth-2023",
      display: "+8.7% (2023)",
      label:
        "ImmoScout24 professional-customer ARPU growth (absolute monthly figure not disclosed)",
      source: SCOUT24_FY2023,
      note: "Scout24 publishes growth rates and customer counts (21,868 professional customers in FY2023) but no absolute per-customer monthly figure — so we quote none.",
    },
  ],
  sources: [HEMNET_Q4_2023, SCOUT24_FY2023],
};

/* ------------------------------------------------------------------ */
/* Section 4 — the CAT claim (ALLEGED, not proven)                     */
/* ------------------------------------------------------------------ */

const LITIGATION: BriefingSection = {
  id: "litigation",
  heading: "The Competition Appeal Tribunal claim — what is alleged",
  paragraphs: [
    "A proposed collective claim against Rightmove has been filed at the Competition Appeal Tribunal (CAT) on behalf of UK estate and lettings agents, with Jeremy Newman — a former Competition and Markets Authority panel member — as the proposed class representative. The claim alleges that Rightmove abused a dominant position by charging agents excessive and unfair subscription fees; the value it seeks is shown below and is an allegation, not a finding. No tribunal has ruled on it, and Rightmove has publicly called the claim \"without merit\" and said it will defend it.",
    `The Tribunal is scheduled to hear the application for a Collective Proceedings Order (certification) on ${CAT_HEARING_DATES}. Certification decides only whether the claim may proceed as collective proceedings — it is not a ruling that anyone was overcharged, and refusal would not be a vindication of portal pricing. The claimed value is the claimant side's own estimate of the ceiling, prepared for certification.`,
  ],
  figures: [
    {
      id: "cat-claim-alleged-value",
      display: `up to ${formatGbpAmount(CAT_CLAIM.value)}`,
      label: CAT_CLAIM.label,
      source: CAT_CLAIM.source,
      alleged: CAT_CLAIM.alleged,
      note: CAT_CLAIM.note,
    },
  ],
  sources: [
    CAT_CLAIM.source,
    CAT_CLAIM_TODAYS_CONVEYANCER,
    CAT_HEARING_PROPERTYWIRE,
  ],
};

export const BRIEFING_SECTIONS: ReadonlyArray<BriefingSection> = [
  FEE_HISTORY,
  PER_BRANCH,
  INTERNATIONAL,
  LITIGATION,
];

/* ------------------------------------------------------------------ */
/* Passthrough estimates — computed from the assumptions file,         */
/* always labelled "Estimate"                                          */
/* ------------------------------------------------------------------ */

export const PASSTHROUGH_ESTIMATES = {
  /** ARPA annualised: sourced monthly figure × 12. */
  annualPortalCostPerBranchPounds: ARPA_FY2023.value * 12,
  /** ARPA ÷ stated listings-per-branch assumption. */
  portalCostPerListingPounds: Math.round(
    ARPA_FY2023.value / LISTINGS_PER_BRANCH.value,
  ),
  /** The inputs behind the estimates, so the page can disclose them. */
  inputs: {
    arpaMonthly: ARPA_FY2023,
    listingsPerBranchMonthly: LISTINGS_PER_BRANCH,
    commissionRateLow: COMMISSION_LOW,
    commissionRateHigh: COMMISSION_HIGH,
  },
} as const;

export const ESTIMATE_CAVEATS: ReadonlyArray<string> = [
  `Listings per branch per month (${LISTINGS_PER_BRANCH.value}) is a TrueDeed stated assumption, not a published statistic — branch throughput varies widely, so the per-listing figure scales directly with it.`,
  "ARPA is a portal-wide average across packages and advertiser types; an individual branch's bill can sit well above or below it.",
  "Whether, and how much of, portal costs pass through to consumers is not established by these figures — they show the scale of the cost line, not its incidence.",
  "The Competition Appeal Tribunal claim against Rightmove is alleged and untested; nothing on this page asserts wrongdoing as fact.",
];

/* ------------------------------------------------------------------ */
/* Press contact — mirrors the /press page (media enquiries → contact) */
/* ------------------------------------------------------------------ */

export const PRESS_CONTACT = {
  heading: "Founder availability and press contact",
  body: "TrueDeed's founder is available for comment, interview and background on portal economics, including on-the-record reaction around the certification hearing. For media enquiries, deadlines included, please reach out to our team via the contact page and mark your message as a press enquiry.",
  contactHref: "/contact",
  contactLabel: "Contact us",
} as const;

/** Every source cited anywhere on the page, for the sources footer. */
export const ALL_SOURCES: ReadonlyArray<BriefingSource> = [
  RM_ANNUAL_REPORT_2010,
  ARPA_FY2023.source,
  RM_FY2025_RNS,
  OTM_FY2023_RESULTS,
  HEMNET_Q4_2023,
  SCOUT24_FY2023,
  CAT_CLAIM.source,
  CAT_CLAIM_TODAYS_CONVEYANCER,
  CAT_HEARING_PROPERTYWIRE,
];
