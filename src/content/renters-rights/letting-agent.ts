import type { RoleTree } from "./types";
import {
  GOVUK_DEPOSIT,
  HA_1988_S13,
  HA_1988_S21,
  HA_2004_S213,
  RRA_2025,
  RRA_2025_GUIDANCE,
} from "./citations";

/**
 * Letting-agent decision tree — post-1-May-2026 regime (Renters' Rights Act
 * 2025, England only). Focused on agency process duties; every outcome cited.
 */
export const LETTING_AGENT_TREE: RoleTree = {
  role: "letting_agent",
  version: 1,
  checkedDate: "1 July 2026",
  start: "q_a_book",
  nodes: [
    {
      id: "q_a_book",
      kind: "question",
      question: "What are you checking today?",
      answers: [
        {
          label: "New lets we're setting up now (on or after 1 May 2026)",
          next: "q_a_advertising",
        },
        {
          label: "The managed book — tenancies that began before 1 May 2026",
          next: "q_a_s21_book",
        },
      ],
    },
    {
      id: "q_a_s21_book",
      kind: "question",
      question: "Do any managed tenancies have a Section 21 notice that was served before 1 May 2026?",
      answers: [
        { label: "Yes", next: "out_a_s21_deadline" },
        { label: "No", next: "q_a_rent_service" },
      ],
    },
    {
      id: "q_a_advertising",
      kind: "question",
      question: "Do your listings state a fixed asking rent, with no offers above it invited or accepted?",
      answers: [
        { label: "Yes — fixed advertised rent only", next: "q_a_advance" },
        { label: "No — we sometimes take best offers", next: "out_a_bidding_ban" },
      ],
    },
    {
      id: "q_a_advance",
      kind: "question",
      question: "At sign-up, do you ever collect more than one month's rent in advance?",
      answers: [
        { label: "Yes", next: "out_a_advance_cap" },
        { label: "No", next: "q_a_rent_service" },
      ],
    },
    {
      id: "q_a_rent_service",
      kind: "question",
      question: "Do you handle rent increases on behalf of landlords?",
      answers: [
        { label: "Yes", next: "out_a_s13_process" },
        { label: "No", next: "q_a_deposit" },
      ],
    },
    {
      id: "q_a_deposit",
      kind: "question",
      question: "Are all deposits protected within 30 days, with the prescribed information served?",
      answers: [
        { label: "Yes", next: "q_a_statement" },
        { label: "No, or I'm not sure", next: "out_a_deposit_risk" },
      ],
    },
    {
      id: "q_a_statement",
      kind: "question",
      question: "Do you issue the written statement of terms and the government's information sheet at the start of every tenancy?",
      answers: [
        { label: "Yes", next: "out_a_compliant" },
        { label: "No", next: "out_a_statement_duty" },
      ],
    },
    {
      id: "out_a_s21_deadline",
      kind: "outcome",
      title: "Audit those files now — court by 31 July 2026 or the notice lapses",
      body: [
        "Section 21 was abolished in England on 1 May 2026. Under the transitional arrangements, a Section 21 notice served before that date can only be relied on if the possession claim reaches court by 31 July 2026 — after that the notice lapses and possession needs a Section 8 ground instead.",
        "Sweep the managed book for live Section 21 notices, flag each one to the instructing landlord in writing, and record their decision: issue the claim before the deadline, or move to a Section 8 ground with the correct notice period.",
        "This is a classic negligence trap for agencies — a missed deadline the landlord was never warned about. A dated file note per tenancy is your protection.",
      ],
      citations: [HA_1988_S21, RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_a_bidding_ban",
      kind: "outcome",
      title: "Stop taking bids — advertised rent is the ceiling",
      body: [
        "The Renters' Rights Act 2025 requires lettings to be advertised at a fixed asking rent and bans inviting, encouraging or accepting offers above the advertised figure. This applies to agents directly, not just landlords.",
        "Update listing templates, applicant scripts and negotiator training so no one on the team solicits or accepts an above-advertised offer — including 'unprompted' offers, which cannot be accepted either.",
        "Councils can issue financial penalties against agents for breaches, so treat this as a compliance item with an audit trail, not a style preference.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_a_advance_cap",
      kind: "outcome",
      title: "Advance rent is capped at one month — change the sign-up process",
      body: [
        "Under the Renters' Rights Act 2025 (as currently in force), requiring more than one month's rent in advance for a new tenancy is prohibited. Multi-month advance rent can no longer be used to get marginal applicants over the line.",
        "Update your sign-up workflow and move-in monies templates: one month's rent in advance plus a deposit within the existing cap. Where affordability is the concern, a guarantor is the lawful alternative.",
        "Make sure landlords you act for understand the change — an unlawful demand made on a landlord's instruction still exposes the agency.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_a_s13_process",
      kind: "outcome",
      title: "Run every increase through Section 13 — once a year, prescribed form",
      body: [
        "Under the reformed Housing Act 1988, rent on a periodic assured tenancy can be increased at most once every 12 months, and only by serving the prescribed Section 13 notice with the required notice period. Rent-review clauses purporting to raise rent automatically do not follow the lawful process.",
        "Diary the 12-month anniversary per tenancy, serve the prescribed form with proof of service, and advise landlords to propose figures they can evidence with comparable lettings — the tenant can refer the rent to the First-tier Tribunal, which cannot award more than the figure proposed.",
        "A standard operating procedure here protects both the landlord's increase and the agency's file.",
      ],
      citations: [HA_1988_S13, RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_a_deposit_risk",
      kind: "outcome",
      title: "Unprotected deposits: fix within 30 days or face 1–3x penalties",
      body: [
        "The Housing Act 2004 requires deposits to be protected in a government-approved scheme within 30 days of receipt, with the prescribed information served on the tenant. Where the agency holds or receives the deposit, this is the agency's operational duty.",
        "Non-compliance exposes the landlord (and in practice the agency relationship) to a court-ordered penalty of one to three times the deposit, and restricts possession claims.",
        "Reconcile deposits held against scheme registrations today, protect any stragglers immediately, and keep service records of the prescribed information for every tenancy.",
      ],
      citations: [HA_2004_S213, GOVUK_DEPOSIT],
    },
    {
      id: "out_a_statement_duty",
      kind: "outcome",
      title: "Issue the written statement of terms on every tenancy",
      body: [
        "Under the Renters' Rights Act 2025 (as currently in force), tenants must be given a written statement of the tenancy terms and the government's prescribed information sheet. Where the agency handles onboarding, building this into move-in packs is the practical way to discharge the landlord's duty.",
        "Add the statement and information sheet to your tenancy-start checklist, and keep dated proof of service alongside the deposit prescribed information.",
        "Non-compliance can attract council enforcement — and a missing statement weakens the landlord's position in any later dispute the agency has to manage.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_a_compliant",
      kind: "outcome",
      title: "No red flags — your agency baseline under the new regime",
      body: [
        "Nothing you told us suggests a current gap. As a reminder of the reformed framework in England: tenancies are periodic, Section 21 is abolished (transitional court deadline 31 July 2026 for pre-May notices), and possession runs on Section 8 grounds with the correct notice periods.",
        "Rent increases are once a year via the prescribed Section 13 form; advertised rent is the ceiling (no bidding); advance rent is capped at one month; deposits must be protected within 30 days; and every tenancy needs the written statement of terms.",
        "Watch commencement updates as remaining parts of the Act — including the ombudsman and the private rented sector database — come into force in phases, and brief your landlords as each lands.",
      ],
      citations: [RRA_2025, HA_1988_S13, RRA_2025_GUIDANCE],
    },
  ],
};
