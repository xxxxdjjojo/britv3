import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoist mocks before any import so vi.mock calls run before module resolution
// ---------------------------------------------------------------------------

const { mockCreateClient, mockAssignAgent, mockRemoveAgent, mockGetListingAgents } =
  vi.hoisted(() => ({
    mockCreateClient: vi.fn(),
    mockAssignAgent: vi.fn(),
    mockRemoveAgent: vi.fn(),
    mockGetListingAgents: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/services/listings/listing-agents-service", () => ({
  assignAgent: mockAssignAgent,
  removeAgent: mockRemoveAgent,
  getListingAgents: mockGetListingAgents,
}));

import { GET, POST, DELETE } from "@/app/api/listings/[id]/agents/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LISTING_ID = "aaaa0001-0001-0001-0001-aaaaaaaaaaaa";
const AGENT_ID = "bbbb0002-0002-0002-0002-bbbbbbbbbbbb";
const USER_ID = "cccc0003-0003-0003-0003-cccccccccccc";
const BAD_ID = "not-a-uuid";

const MOCK_AGENTS = [
  { agent_id: AGENT_ID, display_name: "Jane Smith", created_at: "2025-01-01T00:00:00Z" },
];

const params = Promise.resolve({ id: LISTING_ID });
const badParams = Promise.resolve({ id: BAD_ID });

function makeRequest(method: string, body?: unknown, searchParams?: Record<string, string>): Request {
  const url = new URL(`http://localhost/api/listings/${LISTING_ID}/agents`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new Request(url.toString(), {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeAuthSupabase(
  extraFromRows?: Array<{ data: unknown; error: unknown }>,
): { auth: { getUser: ReturnType<typeof vi.fn> }; from: ReturnType<typeof vi.fn> } {
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });

  let fromCallCount = 0;
  const from = vi.fn(() => {
    const callIndex = fromCallCount++;
    const rows: { data: unknown; error: unknown } =
      extraFromRows?.[callIndex] ?? { data: [], error: null };
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      limit: vi.fn(async () => rows),
    };
    return builder;
  });

  return { auth: { getUser }, from };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetListingAgents.mockResolvedValue(MOCK_AGENTS);
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

describe("GET /api/listings/[id]/agents", () => {
  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });

    const res = await GET(makeRequest("GET") as never, { params } as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid listing uuid", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } }, error: null }) },
    });

    const res = await GET(makeRequest("GET") as never, { params: badParams } as never);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid listing id/i);
  });

  it("returns the agent list on success", async () => {
    mockCreateClient.mockResolvedValue(makeAuthSupabase());

    const res = await GET(makeRequest("GET") as never, { params } as never);
    expect(res.status).toBe(200);
    const body = await res.json() as typeof MOCK_AGENTS;
    expect(body).toEqual(MOCK_AGENTS);
    expect(mockGetListingAgents).toHaveBeenCalledWith(expect.anything(), LISTING_ID);
  });
});

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

describe("POST /api/listings/[id]/agents", () => {
  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });

    const res = await POST(makeRequest("POST", { agentId: AGENT_ID }) as never, { params } as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when agentId is not a uuid", async () => {
    mockCreateClient.mockResolvedValue(makeAuthSupabase());

    const res = await POST(makeRequest("POST", { agentId: "bad" }) as never, { params } as never);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid agentId/i);
  });

  it("returns 400 when the target user is not an estate agent", async () => {
    // The user_roles lookup returns empty — user is not an agent.
    const supabase = makeAuthSupabase([{ data: [], error: null }]);
    mockCreateClient.mockResolvedValue(supabase);

    const res = await POST(makeRequest("POST", { agentId: AGENT_ID }) as never, { params } as never);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/not an estate agent/i);
    expect(mockAssignAgent).not.toHaveBeenCalled();
  });

  it("calls assignAgent with correct args and returns refreshed list on success", async () => {
    // user_roles lookup returns one row → user is an agent
    const supabase = makeAuthSupabase([{ data: [{ user_id: AGENT_ID }], error: null }]);
    mockCreateClient.mockResolvedValue(supabase);
    mockAssignAgent.mockResolvedValue(undefined);

    const res = await POST(makeRequest("POST", { agentId: AGENT_ID }) as never, { params } as never);

    expect(res.status).toBe(200);
    expect(mockAssignAgent).toHaveBeenCalledWith(
      expect.anything(),
      { listingId: LISTING_ID, agentId: AGENT_ID, createdBy: USER_ID },
    );
    const body = await res.json() as typeof MOCK_AGENTS;
    expect(body).toEqual(MOCK_AGENTS);
  });

  it("returns 403 when assignAgent throws the owner-denial message", async () => {
    const supabase = makeAuthSupabase([{ data: [{ user_id: AGENT_ID }], error: null }]);
    mockCreateClient.mockResolvedValue(supabase);
    mockAssignAgent.mockRejectedValue(new Error("Only the listing owner can assign an agent"));

    const res = await POST(makeRequest("POST", { agentId: AGENT_ID }) as never, { params } as never);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

describe("DELETE /api/listings/[id]/agents", () => {
  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });

    const res = await DELETE(
      makeRequest("DELETE", undefined, { agentId: AGENT_ID }) as never,
      { params } as never,
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when agentId is missing or invalid", async () => {
    mockCreateClient.mockResolvedValue(makeAuthSupabase());

    const res = await DELETE(makeRequest("DELETE") as never, { params } as never);
    expect(res.status).toBe(400);
  });

  it("calls removeAgent and returns success", async () => {
    mockCreateClient.mockResolvedValue(makeAuthSupabase());
    mockRemoveAgent.mockResolvedValue(undefined);

    const res = await DELETE(
      makeRequest("DELETE", undefined, { agentId: AGENT_ID }) as never,
      { params } as never,
    );

    expect(res.status).toBe(200);
    expect(mockRemoveAgent).toHaveBeenCalledWith(
      expect.anything(),
      { listingId: LISTING_ID, agentId: AGENT_ID },
    );
    const body = await res.json() as { success: boolean };
    expect(body.success).toBe(true);
  });
});
