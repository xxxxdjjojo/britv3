import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  requireAgent: vi.fn(),
  createAdminClient: vi.fn(),
  getConnector: vi.fn(),
}));

vi.mock("@/lib/api/require-agent", () => ({
  requireAgent: mocks.requireAgent,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/services/connectors", () => ({
  getConnector: mocks.getConnector,
  listConnectorProviders: vi.fn(),
  registerConnector: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const AGENT_AUTH = { user: { id: "agent-1" }, response: undefined };

const ROUTE_CONTEXT = { params: Promise.resolve({ id: "int-sandbox" }) };

function makeAdminChain(integrationData: Record<string, unknown> | null) {
  const chain: Record<string, unknown> = {};
  const self = () => chain as never;
  Object.assign(chain, {
    select: vi.fn(self),
    eq: vi.fn(self),
    single: vi.fn().mockResolvedValue({
      data: integrationData,
      error: integrationData ? null : { message: "Not found" },
    }),
  });
  return chain as Record<string, ReturnType<typeof vi.fn>>;
}

function emptyRequest(): Request {
  return new Request("http://localhost/api/agent/feeds/int-sandbox/test", {
    method: "POST",
  });
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent/feeds/int-sandbox/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/agent/feeds/[id]/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mocks.requireAgent.mockResolvedValue({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(401);
    expect(mocks.getConnector).not.toHaveBeenCalled();
  });

  it("returns the connector's testConnection result for sandbox", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);

    const integrationChain = makeAdminChain({
      provider: "sandbox",
      field_mapping: null,
      organisation_id: "org-1",
    });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => integrationChain),
    });

    const sandboxConnector = {
      provider: "sandbox",
      testConnection: vi.fn().mockResolvedValue({
        ok: true,
        message: "Sandbox fixture reachable — 4 listings parsed",
      }),
    };
    mocks.getConnector.mockReturnValue(sandboxConnector);

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(true);
    expect(body.message).toContain("listings parsed");

    // Connector resolved by provider key
    expect(mocks.getConnector).toHaveBeenCalledWith("sandbox");
    // testConnection called with context including integrationId
    expect(sandboxConnector.testConnection).toHaveBeenCalledWith(
      expect.objectContaining({ integrationId: "int-sandbox", organisationId: "org-1" }),
    );
  });

  it("passes payload from request body into the connector context (csv path)", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);

    const integrationChain = makeAdminChain({
      provider: "csv",
      field_mapping: { Price: "price" },
      organisation_id: null,
    });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => integrationChain),
    });

    const csvConnector = {
      provider: "csv",
      testConnection: vi.fn().mockResolvedValue({ ok: true, message: "CSV parsed OK — 2 listings" }),
    };
    mocks.getConnector.mockReturnValue(csvConnector);

    const csvPayload = "external_id,price\nCSV-1,250000";

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ payload: csvPayload }), ROUTE_CONTEXT);

    expect(res.status).toBe(200);
    expect(csvConnector.testConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: csvPayload,
        fieldMapping: { Price: "price" },
      }),
    );
  });

  it("returns 404 when the integration does not belong to the agent", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);

    const notFoundChain = makeAdminChain(null);
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => notFoundChain),
    });

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(404);
    expect(mocks.getConnector).not.toHaveBeenCalled();
  });

  it("returns 422 when the integration provider has no registered connector (alto)", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);

    const integrationChain = makeAdminChain({
      provider: "alto",
      field_mapping: null,
      organisation_id: null,
    });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => integrationChain),
    });

    mocks.getConnector.mockImplementation(() => {
      throw new Error("Unknown connector provider: alto");
    });

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("alto");
  });

  it("surfaces a failed testConnection result (ok: false) from the connector", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);

    const integrationChain = makeAdminChain({
      provider: "csv",
      field_mapping: null,
      organisation_id: null,
    });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => integrationChain),
    });

    const csvConnector = {
      provider: "csv",
      testConnection: vi.fn().mockResolvedValue({
        ok: false,
        message: "No CSV payload supplied",
      }),
    };
    mocks.getConnector.mockReturnValue(csvConnector);

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(false);
    expect(body.message).toBe("No CSV payload supplied");
  });
});
