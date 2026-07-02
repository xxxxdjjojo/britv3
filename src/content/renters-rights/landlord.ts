import type { RoleTree } from "./types";
import {
  GOVUK_DEPOSIT,
  HA_1988_S8,
  HA_1988_S13,
  HA_1988_S21,
  HA_2004_S213,
  RRA_2025,
  RRA_2025_GUIDANCE,
} from "./citations";

/**
 * Landlord decision tree — post-1-May-2026 regime (Renters' Rights Act 2025,
 * England only). Plain-English statements of duties; every outcome cited.
 */
export const LANDLORD_TREE: RoleTree = {
  role: "landlord",
  version: 1,
  checkedDate: "1 July 2026",
  start: "q_l_tenancy_start",
  nodes: [
    {
      id: "q_l_tenancy_start",
      kind: "question",
      question: "When did the tenancy you're asking about start?",
      help: "On 1 May 2026 existing assured shorthold tenancies in England converted to the new periodic system under the Renters' Rights Act 2025.",
      answers: [
        { label: "Before 1 May 2026", next: "q_l_s21" },
        { label: "On or after 1 May 2026", next: "q_l_advance" },
      ],
    },
    {
      id: "q_l_s21",
      kind: "question",
      question: "Did you serve a Section 21 notice before 1 May 2026?",
      answers: [
        { label: "Yes", next: "out_l_s21_deadline" },
        { label: "No", next: "q_l_rent_plan" },
      ],
    },
    {
      id: "q_l_advance",
      kind: "question",
      question: "Do you ask new tenants for more than one month's rent in advance?",
      answers: [
        { label: "Yes", next: "out_l_advance_cap" },
        { label: "No", next: "q_l_bidding" },
      ],
    },
    {
      id: "q_l_bidding",
      kind: "question",
      question: "When letting, do you invite or accept offers above the advertised rent?",
      answers: [
        { label: "Yes", next: "out_l_bidding_ban" },
        { label: "No", next: "q_l_rent_plan" },
      ],
    },
    {
      id: "q_l_rent_plan",
      kind: "question",
      question: "Are you planning to increase the rent in the next 12 months?",
      answers: [
        { label: "Yes", next: "out_l_s13_process" },
        { label: "No", next: "q_l_deposit" },
      ],
    },
    {
      id: "q_l_deposit",
      kind: "question",
      question: "Is the tenant's deposit protected in an approved scheme, with the prescribed information given?",
      answers: [
        { label: "Yes", next: "q_l_statement" },
        { label: "No, or I'm not sure", next: "out_l_deposit_risk" },
        { label: "No deposit was taken", next: "q_l_statement" },
      ],
    },
    {
      id: "q_l_statement",
      kind: "question",
      question: "Have you given the tenant a written statement of terms and the government's information sheet?",
      answers: [
        { label: "Yes", next: "out_l_compliant" },
        { label: "No", next: "out_l_statement_duty" },
      ],
    },
    {
      id: "out_l_s21_deadline",
      kind: "outcome",
      title: "Your pre-May Section 21 notice must reach court by 31 July 2026",
      body: [
        "Section 21 was abolished for tenancies in England on 1 May 2026. Under the transitional arrangements, a Section 21 notice validly served before that date can only be relied on if your possession claim reaches court by 31 July 2026. After that, the notice lapses.",
        "If you still need possession after the deadline, you must use a specified ground under Section 8 of the Housing Act 1988 (as amended) — for example selling the property, moving in yourself, or serious rent arrears — with the notice period and any qualifying conditions that ground carries.",
        "If the deadline matters to you, act now: issue the claim or take advice on which Section 8 ground fits your circumstances. Relying on a lapsed Section 21 notice risks a struck-out claim and wasted court fees.",
      ],
      citations: [HA_1988_S21, RRA_2025, HA_1988_S8, RRA_2025_GUIDANCE],
    },
    {
      id: "out_l_advance_cap",
      kind: "outcome",
      title: "You can no longer take more than one month's rent in advance",
      body: [
        "Under the Renters' Rights Act 2025 (as currently in force), requiring more than one month's rent in advance for a new tenancy is prohibited. This closes the practice of asking for several months up front, including from tenants who struggle to pass referencing.",
        "You can still take a tenancy deposit (within the existing deposit cap) and carry out normal referencing. If affordability is a genuine concern, a guarantor is the lawful route rather than advance rent.",
        "Local councils can take enforcement action over unlawful advance-rent demands, so update your sign-up process and any agent instructions now.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_l_bidding_ban",
      kind: "outcome",
      title: "Inviting or accepting bids above the advertised rent is banned",
      body: [
        "The Renters' Rights Act 2025 requires lettings to be advertised at a fixed asking rent, and prohibits landlords and agents from inviting, encouraging or accepting offers above that advertised rent.",
        "Set the asking rent at the figure you are actually willing to let at. If demand is strong, you choose between applicants — you cannot run the price up between them.",
        "Councils can issue financial penalties for breaches, and repeat breaches carry escalating consequences, so make sure any letting agent acting for you follows the same rule.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_l_s13_process",
      kind: "outcome",
      title: "Rent increases: once a year, using the Section 13 process",
      body: [
        "Under the reformed Housing Act 1988, rent on a periodic assured tenancy can be increased at most once every 12 months, and only by serving the prescribed Section 13 notice form with the required notice period. Informal increases, or terms in the agreement that purport to raise rent automatically, do not follow the lawful process.",
        "The tenant can refer the proposed rent to the First-tier Tribunal (Property Chamber) before it takes effect. The tribunal determines the market rent, and under the reformed rules it cannot set the rent higher than the figure you proposed — so propose a figure you can evidence with comparable local lettings.",
        "Serve the notice correctly, keep proof of service, and diary the 12-month anniversary — a premature second increase is invalid.",
      ],
      citations: [HA_1988_S13, RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_l_deposit_risk",
      kind: "outcome",
      title: "Protect the deposit now — the penalties are significant",
      body: [
        "The Housing Act 2004 requires you to protect a tenancy deposit in a government-approved scheme within 30 days of receiving it and to give the tenant the scheme's prescribed information. This duty continues under the new tenancy regime.",
        "Failure to comply exposes you to a court-ordered penalty of between one and three times the deposit, payable to the tenant, and can restrict your ability to obtain possession.",
        "If you are outside the 30 days, protect the deposit immediately and serve the prescribed information — late compliance does not erase liability, but it limits ongoing risk. Take advice before serving any possession notice while the deposit is unprotected.",
      ],
      citations: [HA_2004_S213, GOVUK_DEPOSIT],
    },
    {
      id: "out_l_statement_duty",
      kind: "outcome",
      title: "You must give tenants a written statement of terms",
      body: [
        "Under the Renters' Rights Act 2025 (as currently in force), landlords have a duty to give tenants a written statement of the tenancy terms and the government's prescribed information sheet setting out both parties' rights and responsibilities.",
        "Provide the statement for every tenancy — including existing tenancies converted to the new system — and keep proof that it was given. Non-compliance can attract enforcement action by the local council.",
        "A clear written statement also protects you: it is your evidence of the agreed rent, notice arrangements and responsibilities if a dispute reaches the ombudsman or a tribunal.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_l_compliant",
      kind: "outcome",
      title: "No red flags — your compliance baseline under the new regime",
      body: [
        "Nothing you told us suggests a current breach. As a reminder of the reformed framework in England: tenancies are periodic, Section 21 is abolished, and possession requires a specified ground under Section 8 of the Housing Act 1988 (as amended) with the correct notice period.",
        "Rent increases are limited to once a year via the Section 13 prescribed form; advance rent is capped at one month; bidding above advertised rents is banned; deposits must be protected within 30 days; and tenants must receive a written statement of terms.",
        "Keep records of notices, deposit protection and the written statement — and watch for commencement updates, as remaining parts of the Act (such as the ombudsman and database) come into force in phases.",
      ],
      citations: [RRA_2025, HA_1988_S8, HA_1988_S13, RRA_2025_GUIDANCE],
    },
  ],
};
