import {
  HA_1988_S13,
  HA_1988_S21,
  RRA_2025,
  RRA_2025_GUIDANCE,
} from "./citations";
import type { DeadlineEntry } from "./types";

/**
 * The Renters' Rights Act 2025 compliance timeline for England.
 *
 * Dated entries carry ONLY published dates:
 *  - 27 October 2025 — Royal Assent (the Act itself, c. 26).
 *  - 1 May 2026 — the new tenancy system in force in England (the
 *    commencement date used throughout this codebase's Renters' Rights
 *    content and GOV.UK guidance).
 *  - 31 July 2026 — transitional long-stop for possession claims relying on
 *    a Section 21 notice served before commencement (same transitional rule
 *    as src/content/renters-rights/*).
 *
 * Everything whose date has not been published (PRS Database registration
 * windows, Ombudsman scheme, Decent Homes Standard, Awaab's Law extension)
 * is a trigger-rule entry — never a guessed date.
 */
export const RRA_DEADLINES: ReadonlyArray<DeadlineEntry> = [
  {
    id: "royal-assent",
    kind: "dated",
    date: "2025-10-27",
    title: "Renters' Rights Act 2025 receives Royal Assent",
    summary:
      "The Renters' Rights Act 2025 (c. 26) became law. Nothing changed for tenancies on this date — the reforms take effect in phases from 1 May 2026 — but this is the Act every deadline below flows from.",
    appliesTo: ["all_landlords"],
    citations: [RRA_2025],
    agentUsuallyHandles: false,
  },
  {
    id: "commencement",
    kind: "dated",
    date: "2026-05-01",
    title: "New tenancy system in force in England",
    summary:
      "Existing assured shorthold tenancies converted to the new periodic assured system, Section 21 was abolished for new notices, rent in advance is capped at one month for tenancies starting on or after this date, and rental bidding above the advertised price is banned. Possession now needs a Section 8 ground; rent increases go through the Section 13 process.",
    appliesTo: ["all_landlords"],
    citations: [RRA_2025, RRA_2025_GUIDANCE, HA_1988_S21],
    agentUsuallyHandles: false,
  },
  {
    id: "s21-longstop",
    kind: "dated",
    date: "2026-07-31",
    title:
      "Last day for possession claims relying on a pre-1 May 2026 Section 21 notice",
    summary:
      "Under the transitional arrangements, a Section 21 notice validly served before 1 May 2026 can only be relied on if your possession claim reaches court by 31 July 2026. After that the notice lapses and possession needs a Section 8 ground instead.",
    appliesTo: ["pre_may_tenancies"],
    citations: [RRA_2025, RRA_2025_GUIDANCE, HA_1988_S21],
    agentUsuallyHandles: true,
  },
  {
    id: "first-rent-increase",
    kind: "trigger",
    trigger:
      "The next time you want to increase the rent on any tenancy — the new rules already apply.",
    title: "Rent increases: Section 13 notice only, once per year",
    summary:
      "From 1 May 2026, rent on an assured tenancy in England can only be increased through a Section 13 notice, at most once a year, with the tenant able to challenge the proposed rent at the First-tier Tribunal. Rent review clauses in existing agreements no longer bite.",
    appliesTo: ["all_landlords"],
    citations: [HA_1988_S13, RRA_2025_GUIDANCE],
    agentUsuallyHandles: true,
  },
  {
    id: "prs-database",
    kind: "trigger",
    trigger:
      "Once the Private Rented Sector Database opens for registration — exact windows are expected to be announced in late 2026. We will email subscribers when a date is published.",
    title: "Register yourself and your properties on the PRS Database",
    summary:
      "The Act creates a national Private Rented Sector Database. Landlords will be required to register themselves and their rental properties before marketing or letting them once the duty is commenced. Registration remains the landlord's legal duty even where an agent manages the property.",
    appliesTo: ["all_landlords"],
    citations: [RRA_2025, RRA_2025_GUIDANCE],
    agentUsuallyHandles: true,
  },
  {
    id: "prs-ombudsman",
    kind: "trigger",
    trigger:
      "Once the scheme opens to landlord registration — no date has been published yet.",
    title: "Join the Private Rented Sector Landlord Ombudsman scheme",
    summary:
      "The Act requires private landlords in England to join a new landlord ombudsman scheme once it is established, giving tenants a route to binding complaint resolution. Membership applies whether or not you use a managing agent.",
    appliesTo: ["all_landlords"],
    citations: [RRA_2025, RRA_2025_GUIDANCE],
    agentUsuallyHandles: false,
  },
  {
    id: "decent-homes",
    kind: "trigger",
    trigger:
      "Once applied to the private rented sector by regulations — no commencement date has been published yet.",
    title: "Meet the Decent Homes Standard",
    summary:
      "The Act provides for a Decent Homes Standard to apply to privately rented homes in England for the first time. The detailed standard and the date it starts to apply will be set in regulations.",
    appliesTo: ["all_landlords"],
    citations: [RRA_2025, RRA_2025_GUIDANCE],
    agentUsuallyHandles: false,
  },
  {
    id: "awaabs-law",
    kind: "trigger",
    trigger:
      "Once extended to private tenancies by regulations — no date has been published yet.",
    title: "Awaab's Law hazard timescales extend to private tenancies",
    summary:
      "The Act provides for Awaab's Law — fixed timescales for investigating and fixing serious hazards such as damp and mould — to be extended to the private rented sector by regulations. When commenced, missing the timescales will be enforceable against landlords.",
    appliesTo: ["all_landlords"],
    citations: [RRA_2025, RRA_2025_GUIDANCE],
    agentUsuallyHandles: true,
  },
];
