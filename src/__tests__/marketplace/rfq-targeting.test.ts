import { describe, it, expect, vi } from "vitest";

// Mock inngest + geocoding so createGuestRfq is unit-testable
vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi
    .fn()
    .mockResolvedValue({ longitude: -0.1, latitude: 51.5 }),
}));

import {
  createGuestRfq,
  listProviderMatchedRfqs,
  matchProvidersForRfq,
} from "@/services/marketplace/rfq-service";
import { getProviderLeads } from "@/services/provider/provider-job-service";

/** Chainable supabase query mock that records calls and resolves `result`. */
function chainMock(result: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of [
    "select",
    "insert",
    "update",
    "eq",
    "in",
    "is",
    "or",
    "not",
    "gte",
    "gt",
    "contains",
    "order",
    "range",
    "limit",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  (chain as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
  ) => resolve(result);
  return { chain };
}

const GUEST_INPUT = {
  service_category: "plumber" as const,
  title: "Fix leaking kitchen tap",
  description:
    "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal" as const,
  target_provider_id: "123e4567-e89b-12d3-a456-426614174000",
  source: "trader_profile_modal",
  contact_name: "Jane Smith",
  contact_email: "jane@example.com",
};

describe("createGuestRfq", () => {
  it("inserts with null user_id and guest contact fields", async () => {
    const inserted: Record<string, unknown>[] = [];
    const { chain } = chainMock({ data: { id: "rfq-1" }, error: null });
    chain.insert.mockImplementation((row: Record<string, unknown>) => {
      inserted.push(row);
      return chain;
    });
    const supabase = { from: vi.fn(() => chain) };

    await createGuestRfq(supabase as never, GUEST_INPUT);

    expect(inserted[0]).toMatchObject({
      user_id: null,
      contact_name: "Jane Smith",
      contact_email: "jane@example.com",
      target_provider_id: GUEST_INPUT.target_provider_id,
      source: "trader_profile_modal",
      status: "open",
    });
  });

  it("rejects an invalid guest payload (missing contact_email)", async () => {
    const { chain } = chainMock({ data: { id: "rfq-1" }, error: null });
    const supabase = { from: vi.fn(() => chain) };
    const { contact_email: _drop, ...noEmail } = GUEST_INPUT;

    await expect(
      createGuestRfq(supabase as never, noEmail as never),
    ).rejects.toThrow();
    expect(chain.insert).not.toHaveBeenCalled();
  });
});

describe("listProviderMatchedRfqs targeting filter", () => {
  it("applies an or-filter limiting to broadcast or own-targeted RFQs", async () => {
    const providerChain = chainMock({
      data: { services: ["plumber"] },
      error: null,
    });
    const rfqCalls: unknown[][] = [];
    const rfqChain = chainMock({ data: [], error: null, count: 0 });
    rfqChain.chain.or.mockImplementation((...args: unknown[]) => {
      rfqCalls.push(args);
      return rfqChain.chain;
    });
    const supabase = {
      from: vi.fn((table: string) =>
        table === "service_provider_details"
          ? providerChain.chain
          : rfqChain.chain,
      ),
    };

    await listProviderMatchedRfqs(supabase as never, "provider-1");

    expect(rfqCalls.flat().join(" ")).toContain("target_provider_id.is.null");
    expect(rfqCalls.flat().join(" ")).toContain(
      "target_provider_id.eq.provider-1",
    );
  });
});

describe("matchProvidersForRfq targeted short-circuit", () => {
  it("returns only the target provider for a targeted RFQ", async () => {
    const rfqChain = chainMock({
      data: {
        id: "rfq-1",
        service_category: "plumber",
        property_postcode: "SW1A 1AA",
        target_provider_id: "target-provider-uuid",
      },
      error: null,
    });
    const targetChain = chainMock({
      data: {
        user_id: "target-provider-uuid",
        business_name: "Richards Plumbing",
      },
      error: null,
    });
    let call = 0;
    const supabase = {
      from: vi.fn(() => (call++ === 0 ? rfqChain.chain : targetChain.chain)),
    };

    const matched = await matchProvidersForRfq(supabase as never, "rfq-1");

    expect(matched).toHaveLength(1);
    expect(matched[0].user_id).toBe("target-provider-uuid");
  });
});

describe("getProviderLeads targeting", () => {
  const PROVIDER_ID = "provider-1";
  const NOW = Date.now();

  const broadcastRow = {
    id: "lead-broadcast",
    service_category: "plumber",
    title: "Broadcast job",
    description: "A broadcast lead posted very recently by a homeowner.",
    budget_min: 100,
    budget_max: 500,
    property_postcode: "SW1A 1AA",
    urgency_level: "normal",
    status: "open",
    created_at: new Date(NOW).toISOString(),
    target_provider_id: null,
  };

  const targetedRow = {
    id: "lead-direct",
    service_category: "plumber",
    title: "Direct request job",
    description: "A lead sent directly to this provider, older than broadcast.",
    budget_min: 200,
    budget_max: 800,
    property_postcode: "E1 6AN",
    urgency_level: "normal",
    status: "open",
    created_at: new Date(NOW - 10 * 60 * 60 * 1000).toISOString(),
    target_provider_id: PROVIDER_ID,
  };

  function makeClient() {
    const providerChain = chainMock({
      data: { services: ["plumber"], service_postcodes: ["SW1A 1AA"] },
      error: null,
    });
    const orCalls: unknown[][] = [];
    const rfqChain = chainMock({
      data: [broadcastRow, targetedRow],
      error: null,
    });
    rfqChain.chain.or.mockImplementation((...args: unknown[]) => {
      orCalls.push(args);
      return rfqChain.chain;
    });
    const supabase = {
      from: vi.fn((table: string) =>
        table === "service_provider_details"
          ? providerChain.chain
          : rfqChain.chain,
      ),
    };
    return { supabase, orCalls };
  }

  it("queries with an or-filter covering broadcast-recent and own-targeted leads", async () => {
    const { supabase, orCalls } = makeClient();

    await getProviderLeads(PROVIDER_ID, supabase as never);

    const flat = orCalls.flat().join(" ");
    expect(flat).toContain("target_provider_id.is.null");
    expect(flat).toContain(`target_provider_id.eq.${PROVIDER_ID}`);
  });

  it("flags targeted leads isDirect and sorts them first", async () => {
    const { supabase } = makeClient();

    const leads = await getProviderLeads(PROVIDER_ID, supabase as never);

    expect(leads).toHaveLength(2);
    expect(leads[0].id).toBe("lead-direct");
    expect(leads[0].isDirect).toBe(true);
    expect(leads[1].id).toBe("lead-broadcast");
    expect(leads[1].isDirect).toBe(false);
  });
});
