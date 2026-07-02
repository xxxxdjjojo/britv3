import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentLead } from "@/types/agent";

// ---------------------------------------------------------------------------
// Mocks (supabase server client + analytics + observability) — installed
// before the route handler imports its dependencies.
// ---------------------------------------------------------------------------

const { mockCreateClient, mockCapture, mockCaptureException } = vi.hoisted(
  () => ({
    mockCreateClient: vi.fn(),
    mockCapture: vi.fn(),
    mockCaptureException: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/analytics/posthog-server", () => ({
  posthogServer: { capture: mockCapture },
}));

vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: mockCaptureException,
}));

// ---------------------------------------------------------------------------
// Import handler after mocks are registered.
// ---------------------------------------------------------------------------

import { GET } from "@/app/api/agent/leads/export/route";

const AGENT_ID = "22222222-2222-4222-8222-222222222222";

function makeLead(overrides: Partial<AgentLead> = {}): AgentLead {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    agent_id: AGENT_ID,
    property_id: null,
    contact_name: "Jane Doe",
    contact_email: "jane@example.com",
    contact_phone: "07700 900000",
    stage: "new_enquiry",
    source: "website",
    assigned_to: null,
    notes: null,
    created_at: "2026-07-01T10:00:00Z",
    updated_at: "2026-07-01T11:00:00Z",
    ...overrides,
  };
}

type QueryResult = { data: AgentLead[] | null; error: { message: string } | null };

function installClient(user: { id: string } | null, result: QueryResult) {
  const limit = vi.fn(async () => result);
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
    },
    from,
  });

  return { from, select, eq, order, limit };
}

describe("GET /api/agent/leads/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 and never queries leads when anonymous", async () => {
    const { from } = installClient(null, { data: [], error: null });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
    expect(from).not.toHaveBeenCalled();
  });

  it("returns 200 CSV with attachment disposition for an authenticated agent", async () => {
    installClient({ id: AGENT_ID }, { data: [makeLead()], error: null });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toMatch(
      /^attachment; filename="truedeed-leads-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
  });

  it("flows lead rows through into the CSV body, RLS-scoped to the agent", async () => {
    const { eq, from } = installClient(
      { id: AGENT_ID },
      { data: [makeLead({ contact_name: "Bob Buyer" })], error: null },
    );

    const res = await GET();
    const bytes = new Uint8Array(await res.arrayBuffer());
    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);

    // UTF-8 BOM on the wire (res.text() would strip it per the Fetch spec)
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(body.startsWith("\uFEFF")).toBe(true);
    expect(body).toContain("contact_name,contact_email,contact_phone");
    expect(body).toContain('"Bob Buyer"');
    expect(from).toHaveBeenCalledWith("agent_leads");
    expect(eq).toHaveBeenCalledWith("agent_id", AGENT_ID);
  });

  it("caps the export query at 10,000 rows", async () => {
    const { limit } = installClient({ id: AGENT_ID }, { data: [], error: null });

    await GET();

    expect(limit).toHaveBeenCalledWith(10000);
  });

  it("writes the agent_leads_exported audit event with user id and row count", async () => {
    installClient(
      { id: AGENT_ID },
      { data: [makeLead(), makeLead({ id: "33333333-3333-4333-8333-333333333333" })], error: null },
    );

    await GET();

    expect(mockCapture).toHaveBeenCalledWith({
      event: "agent_leads_exported",
      distinctId: AGENT_ID,
      properties: { user_id: AGENT_ID, row_count: 2 },
    });
  });

  it("returns 500 and captures the exception when the query fails", async () => {
    installClient(
      { id: AGENT_ID },
      { data: null, error: { message: "boom" } },
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to export leads");
    expect(mockCaptureException).toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
  });
});
