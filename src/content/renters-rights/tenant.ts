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
 * Tenant decision tree — post-1-May-2026 regime (Renters' Rights Act 2025,
 * England only). Plain-English statements of rights; every outcome cited.
 */
export const TENANT_TREE: RoleTree = {
  role: "tenant",
  version: 1,
  checkedDate: "1 July 2026",
  start: "q_tenancy_start",
  nodes: [
    {
      id: "q_tenancy_start",
      kind: "question",
      question: "When did your current tenancy start?",
      help: "The new tenancy system in England came into force on 1 May 2026. Tenancies that began before that date were converted to the new periodic system on that day.",
      answers: [
        { label: "Before 1 May 2026", next: "q_s21" },
        { label: "On or after 1 May 2026", next: "q_rent_advance" },
      ],
    },
    {
      id: "q_s21",
      kind: "question",
      question: "Has your landlord served you a Section 21 (“no-fault”) eviction notice?",
      help: "A Section 21 notice is the old “no-fault” route: it did not have to give a reason.",
      answers: [
        { label: "Yes — it was served before 1 May 2026", next: "out_s21_pre" },
        { label: "Yes — it was served on or after 1 May 2026", next: "out_s21_post" },
        { label: "No", next: "q_rent_raised" },
      ],
    },
    {
      id: "q_rent_advance",
      kind: "question",
      question: "When you signed up, were you asked to pay more than one month's rent in advance?",
      answers: [
        { label: "Yes", next: "out_advance_cap" },
        { label: "No", next: "q_bidding" },
      ],
    },
    {
      id: "q_bidding",
      kind: "question",
      question: "Were you asked or encouraged to offer more than the advertised rent to secure the property?",
      answers: [
        { label: "Yes", next: "out_bidding_ban" },
        { label: "No", next: "q_rent_raised" },
      ],
    },
    {
      id: "q_rent_raised",
      kind: "question",
      question: "Has your landlord increased your rent in the last 12 months?",
      answers: [
        {
          label: "Yes — more than once in a year, or with no formal notice",
          next: "out_rent_challenge",
        },
        {
          label: "Yes — once, with a formal Section 13 notice",
          next: "out_rent_notice",
        },
        { label: "No", next: "q_deposit" },
      ],
    },
    {
      id: "q_deposit",
      kind: "question",
      question: "Is your deposit protected in a government-approved deposit scheme?",
      help: "Your landlord or agent must protect your deposit and give you the scheme's prescribed information.",
      answers: [
        { label: "Yes, and I received the scheme paperwork", next: "q_written_statement" },
        { label: "No, or I'm not sure", next: "out_deposit_unprotected" },
        { label: "I didn't pay a deposit", next: "q_written_statement" },
      ],
    },
    {
      id: "q_written_statement",
      kind: "question",
      question: "Have you been given a written statement of your tenancy terms?",
      help: "Under the new regime landlords have a duty to give tenants a written statement of terms and the government's prescribed information sheet.",
      answers: [
        { label: "Yes", next: "out_tenant_baseline" },
        { label: "No", next: "out_written_statement" },
      ],
    },
    {
      id: "out_s21_pre",
      kind: "outcome",
      title: "Your Section 21 notice is on a strict transitional deadline",
      body: [
        "Section 21 was abolished for tenancies in England on 1 May 2026. A Section 21 notice served before that date can only still be used if your landlord's possession claim reaches court by 31 July 2026. If no court proceedings have started by then, the notice lapses and cannot be enforced.",
        "After the notice lapses, your landlord can only seek possession using a specified legal ground under Section 8 of the Housing Act 1988 (as amended) — for example serious rent arrears, selling the property, or moving in — with the notice period that ground requires.",
        "Do not feel pressured to leave on the strength of an expired notice. If you receive court papers, get advice straight away — free help is available from Shelter, Citizens Advice or a housing solicitor.",
      ],
      citations: [HA_1988_S21, RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_s21_post",
      kind: "outcome",
      title: "A Section 21 notice served on or after 1 May 2026 is not valid",
      body: [
        "Section 21 “no-fault” evictions were abolished in England from 1 May 2026 by the Renters' Rights Act 2025. A Section 21 notice served on or after that date has no legal effect and cannot end your tenancy.",
        "Your landlord can only end the tenancy using a specified legal ground under Section 8 of the Housing Act 1988 (as amended), with the correct notice period for that ground. You do not have to leave unless a court orders possession.",
        "If you have been given an invalid notice, you can stay put and seek advice. Keep a copy of the notice and any correspondence.",
      ],
      citations: [RRA_2025, HA_1988_S21, HA_1988_S8, RRA_2025_GUIDANCE],
    },
    {
      id: "out_advance_cap",
      kind: "outcome",
      title: "Advance rent is capped at one month",
      body: [
        "Under the Renters' Rights Act 2025 (as currently in force), landlords and agents cannot require more than one month's rent in advance for a new tenancy. Demanding several months up front is no longer allowed.",
        "If you were asked for more than one month in advance on a tenancy that began on or after 1 May 2026, that demand is likely unlawful. You can raise it with the landlord or agent in writing, and report it to your local council's private renting or trading standards team.",
        "This sits alongside the existing cap on tenancy deposits. Keep receipts and written records of everything you paid at the start of the tenancy.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_bidding_ban",
      kind: "outcome",
      title: "Rental bidding wars are banned",
      body: [
        "The Renters' Rights Act 2025 bans rental bidding: landlords and letting agents must advertise a fixed asking rent and cannot invite, encourage or accept offers above the advertised rent.",
        "If you were pushed to bid above the advertised figure for a tenancy under the new regime, that practice is prohibited. You can report it to your local council, which can take enforcement action.",
        "Keep the original listing (a screenshot is fine) and any messages inviting higher offers — they are your evidence.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_rent_challenge",
      kind: "outcome",
      title: "You can challenge this rent increase",
      body: [
        "Under the reformed rules, rent can only be increased once every 12 months and only using the formal Section 13 notice procedure in the Housing Act 1988 (as amended), with the required notice period. An increase demanded informally, or a second increase within a year, does not follow the lawful process.",
        "You do not have to accept an increase served outside the Section 13 process. You can challenge a proposed increase at the First-tier Tribunal (Property Chamber), which decides what the market rent should be — and under the reformed rules it cannot set the rent higher than the landlord proposed.",
        "Respond in writing, keep paying your existing rent while any challenge is decided, and get advice if you are unsure about deadlines — tribunal applications must be made before the increase takes effect.",
      ],
      citations: [HA_1988_S13, RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_rent_notice",
      kind: "outcome",
      title: "A Section 13 increase can still be checked — and challenged",
      body: [
        "A single rent increase per year using the formal Section 13 notice is the lawful route under the reformed Housing Act 1988. That does not mean you must accept the new figure.",
        "If you believe the proposed rent is above the market rate, you can apply to the First-tier Tribunal (Property Chamber) before the increase takes effect. Under the reformed rules the tribunal cannot set a rent higher than the landlord proposed, so challenging cannot make your position worse on the rent figure itself.",
        "Compare similar local listings as evidence, and act within the notice period stated on the Section 13 form.",
      ],
      citations: [HA_1988_S13, RRA_2025_GUIDANCE],
    },
    {
      id: "out_deposit_unprotected",
      kind: "outcome",
      title: "An unprotected deposit is a breach with real penalties",
      body: [
        "Your landlord must protect your deposit in a government-approved scheme within 30 days of receiving it and give you the scheme's prescribed information. This duty comes from the Housing Act 2004 and still applies under the new tenancy regime.",
        "If your deposit is not protected, a court can order the landlord to pay you compensation of between one and three times the deposit amount, and failure to protect can also restrict the landlord's ability to obtain possession.",
        "Check the three approved schemes' websites first (a free search with your postcode and deposit details) — your deposit may be protected without you having received the paperwork.",
      ],
      citations: [HA_2004_S213, GOVUK_DEPOSIT],
    },
    {
      id: "out_written_statement",
      kind: "outcome",
      title: "You are entitled to your tenancy terms in writing",
      body: [
        "Under the Renters' Rights Act 2025 (as currently in force), landlords have a duty to give tenants a written statement of the tenancy terms and the government's prescribed information sheet setting out both sides' rights and responsibilities.",
        "If you have never been given anything in writing, ask for the written statement — in writing, so there is a dated record. A landlord who fails to comply can face enforcement action by the local council.",
        "Having the terms in writing protects you in any later dispute about rent, notice or repairs, so it is worth chasing even when the tenancy is going smoothly.",
      ],
      citations: [RRA_2025, RRA_2025_GUIDANCE],
    },
    {
      id: "out_tenant_baseline",
      kind: "outcome",
      title: "No red flags — here is your baseline of rights",
      body: [
        "Nothing you told us suggests a current breach. Under the reformed system in England you have a periodic tenancy that rolls month to month: you can leave by giving the required notice, and your landlord can only end the tenancy using a specified legal ground under Section 8 of the Housing Act 1988 (as amended) — Section 21 “no-fault” evictions are abolished.",
        "Rent can rise at most once a year through the formal Section 13 process, and you can challenge an above-market increase at the First-tier Tribunal. Bidding above advertised rents and demands for more than one month's rent in advance are banned for new tenancies.",
        "Keep your tenancy paperwork, deposit certificate and any correspondence together — a good paper trail is the single most useful protection if anything changes.",
      ],
      citations: [RRA_2025, HA_1988_S8, HA_1988_S13, RRA_2025_GUIDANCE],
    },
  ],
};
