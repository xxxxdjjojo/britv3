/**
 * Inline fixtures for agent leads + CRM + analytics component tests.
 *
 * No agent fixture file exists under src/__tests__/fixtures, so these mirror
 * the real types in src/types/agent.ts (and the PerformanceReport service type)
 * directly. Kept deterministic — fixed ids and ISO timestamps.
 */

import type {
  AgentLead,
  AgentLeadActivity,
  AgentTeamMember,
  AgentCrmClient,
  LeadStage,
} from "@/types/agent";
import type { PerformanceReport } from "@/services/agent/agent-analytics-service";

const AGENT_ID = "agent-0000-0000-0000-000000000001";

export function makeLead(overrides: Partial<AgentLead> = {}): AgentLead {
  return {
    id: "lead-1",
    agent_id: AGENT_ID,
    property_id: null,
    contact_name: "Jane Buyer",
    contact_email: "jane@example.com",
    contact_phone: "07700900001",
    stage: "new_enquiry",
    source: "website",
    assigned_to: null,
    notes: null,
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-06-01T10:00:00.000Z",
    ...overrides,
  };
}

/** A pipeline grouped by stage, used by LeadPipelineKanban. */
export const LEADS_BY_STAGE: Partial<Record<LeadStage, AgentLead[]>> = {
  new_enquiry: [
    makeLead({ id: "lead-new-1", contact_name: "Alice Anderson" }),
    makeLead({
      id: "lead-new-2",
      contact_name: "Bob Brown",
      contact_email: "bob@example.com",
      source: "portal",
    }),
  ],
  qualified: [
    makeLead({
      id: "lead-qual-1",
      contact_name: "Carol Clarke",
      stage: "qualified",
      source: "referral",
    }),
  ],
  viewing_booked: [],
  offer_made: [
    makeLead({
      id: "lead-offer-1",
      contact_name: "Dan Davies",
      stage: "offer_made",
      contact_email: null,
      source: null,
    }),
  ],
  closed: [],
};

export function makeActivity(
  overrides: Partial<AgentLeadActivity> = {},
): AgentLeadActivity {
  return {
    id: "act-1",
    lead_id: "lead-1",
    actor_id: "user-actor-1",
    activity_type: "lead_created",
    description: "Lead created from website enquiry",
    metadata: null,
    created_at: "2026-06-01T10:00:00.000Z",
    ...overrides,
  };
}

export const LEAD_ACTIVITIES: AgentLeadActivity[] = [
  makeActivity({
    id: "act-created",
    activity_type: "lead_created",
    description: "Lead created from website enquiry",
  }),
  makeActivity({
    id: "act-note",
    activity_type: "note_added",
    description: "Called the buyer, very keen",
    actor_id: "user-me-1",
  }),
  makeActivity({
    id: "act-stage",
    activity_type: "stage_changed",
    description: "Moved to Qualified",
    actor_id: "user-other-99",
  }),
];

export function makeTeamMember(
  overrides: Partial<AgentTeamMember> = {},
): AgentTeamMember {
  return {
    id: "tm-1",
    agent_id: AGENT_ID,
    user_id: "user-tm-1",
    branch_id: null,
    role: "negotiator",
    status: "active",
    email: "negotiator@example.com",
    name: "Nina Negotiator",
    invited_at: "2026-01-01T00:00:00.000Z",
    joined_at: "2026-01-02T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export const TEAM_MEMBERS: AgentTeamMember[] = [
  makeTeamMember({ id: "tm-1", user_id: "user-tm-1", name: "Nina Negotiator" }),
  makeTeamMember({ id: "tm-2", user_id: "user-tm-2", name: "Sam Senior" }),
];

export function makeClient(
  overrides: Partial<AgentCrmClient> = {},
): AgentCrmClient {
  return {
    id: "client-1",
    agent_id: AGENT_ID,
    user_id: null,
    name: "Olivia Owner",
    email: "olivia@example.com",
    phone: "07700900100",
    client_type: "seller",
    preferences: null,
    notes: null,
    tags: null,
    last_contact_at: "2026-05-20T09:00:00.000Z",
    created_at: "2026-01-10T09:00:00.000Z",
    updated_at: "2026-05-20T09:00:00.000Z",
    ...overrides,
  };
}

export const CRM_CLIENTS: AgentCrmClient[] = [
  makeClient({
    id: "client-buyer",
    name: "Peter Purchaser",
    email: "peter@example.com",
    client_type: "buyer",
  }),
  makeClient({
    id: "client-seller",
    name: "Olivia Owner",
    email: "olivia@example.com",
    client_type: "seller",
  }),
  makeClient({
    id: "client-landlord",
    name: "Larry Landlord",
    email: "larry@example.com",
    client_type: "landlord",
    last_contact_at: null,
  }),
];

export function makePerformanceReport(
  overrides: Partial<PerformanceReport> = {},
): PerformanceReport {
  return {
    listings_sold_count: 42,
    avg_time_on_market_days: 38,
    total_revenue: 1_250_000,
    conversion_rate: 0.25,
    client_satisfaction: 4.6,
    listings_sold_per_month: [
      { month: "2026-01", count: 3 },
      { month: "2026-02", count: 5 },
    ],
    revenue_per_month: [
      { month: "2026-01", amount: 250_000 },
      { month: "2026-02", amount: 410_000 },
    ],
    ...overrides,
  };
}

/**
 * Empty performance report — every numeric metric at zero, series empty.
 * The charts component reads listings_over_time / revenue_over_time from the
 * report (extra keys it casts at runtime); without them the chart bodies fall
 * back to their "No data" empty states.
 */
export function makeEmptyPerformanceReport(): PerformanceReport {
  return {
    listings_sold_count: 0,
    avg_time_on_market_days: 0,
    total_revenue: 0,
    conversion_rate: 0,
    client_satisfaction: 0,
    listings_sold_per_month: [],
    revenue_per_month: [],
  };
}
