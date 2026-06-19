import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  requireAgent: vi.fn(),
  createAdminClient: vi.fn(),
  runConnectorImport: vi.fn(),
  getFeedImportRunReview: vi.fn(),
  setFeedIntegrationSyncStatus: vi.fn(),
}));

vi.mock("@/lib/api/require-agent", () => ({
  requireAgent: mocks.requireAgent,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/services/connectors/run-import", () => ({
  runConnectorImport: mocks.runConnectorImport,
}));

vi.mock("@/services/agent/agent-feed-import-service", () => ({
  getFeedImportRunReview: mocks.getFeedImportRunReview,
  createDeterministicReapitImportRun: vi.fn(),
}));

vi.mock("@/services/agent/agent-feed-service", () => ({
  setFeedIntegrationSyncStatus: mocks.setFeedIntegrationSyncStatus,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_CLIENT = {};

const AGENT_AUTH = { user: { id: "agent-1" }, response: undefined };

const MOCK_SUMMARY = {
  run_id: "run-1",
  total_items: 3,
  eligible_items: 2,
  error_items: 0,
  withdrawn_items: 1,
};

const MOCK_REVIEW = {
  run: {
    id: "run-1",
    status: "needs_review",
    total_items: 3,
    eligible_items: 2,
    error_items: 0,
    published_items: 0,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  items: [],
};

const MOCK_INTEGRATION = {
  id: "int-1",
  provider: "reapit",
  sync_status: "connected",
};

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent/feeds/int-1/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function emptyRequest(): Request {
  return new Request("http://localhost/api/agent/feeds/int-1/sync", {
    method: "POST",
  });
}

const ROUTE_CONTEXT = { params: Promise.resolve({ id: "int-1" }) };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/agent/feeds/[id]/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue(ADMIN_CLIENT);
  });

  it("returns 401 when the user is not authenticated", async () => {
    mocks.requireAgent.mockResolvedValue({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(401);
    expect(mocks.runConnectorImport).not.toHaveBeenCalled();
  });

  it("dispatches via runConnectorImport and returns review on success", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);
    mocks.runConnectorImport.mockResolvedValue({
      summary: MOCK_SUMMARY,
      errors: [],
    });
    mocks.getFeedImportRunReview.mockResolvedValue(MOCK_REVIEW);
    mocks.setFeedIntegrationSyncStatus.mockResolvedValue(MOCK_INTEGRATION);

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty("review");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("integration");

    // runConnectorImport called with the admin client and agent id
    expect(mocks.runConnectorImport).toHaveBeenCalledWith(
      ADMIN_CLIENT,
      "agent-1",
      "int-1",
      expect.objectContaining({ payload: undefined, fieldMapping: undefined }),
    );
    // sync status updated to connected on success
    expect(mocks.setFeedIntegrationSyncStatus).toHaveBeenCalledWith(
      ADMIN_CLIENT,
      "int-1",
      "agent-1",
      expect.objectContaining({ sync_status: "connected" }),
    );
  });

  it("passes payload and fieldMapping from request body to runConnectorImport (csv path)", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);
    mocks.runConnectorImport.mockResolvedValue({
      summary: MOCK_SUMMARY,
      errors: [],
    });
    mocks.getFeedImportRunReview.mockResolvedValue(MOCK_REVIEW);
    mocks.setFeedIntegrationSyncStatus.mockResolvedValue(MOCK_INTEGRATION);

    const csvPayload = "external_id,price\nCSV-1,250000";
    const mapping = { external_id: "external_id", price: "price" };

    const { POST } = await import("./route");
    const res = await POST(
      jsonRequest({ payload: csvPayload, fieldMapping: mapping }),
      ROUTE_CONTEXT,
    );

    expect(res.status).toBe(200);
    expect(mocks.runConnectorImport).toHaveBeenCalledWith(
      ADMIN_CLIENT,
      "agent-1",
      "int-1",
      { payload: csvPayload, fieldMapping: mapping },
    );
  });

  it("returns 409 with blocked reason when empty-feed guard fires", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);
    const blockedReason = "Refusing to process an empty feed: 5 previously published listing(s) would be withdrawn.";
    mocks.runConnectorImport.mockResolvedValue({
      summary: { run_id: "", total_items: 0, eligible_items: 0, error_items: 0, withdrawn_items: 0 },
      errors: [],
      blocked: { reason: blockedReason },
    });

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(409);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty("blocked");
    expect((body.blocked as { reason: string }).reason).toBe(blockedReason);

    // No review fetched and sync_status NOT set to connected when blocked
    expect(mocks.getFeedImportRunReview).not.toHaveBeenCalled();
    expect(mocks.setFeedIntegrationSyncStatus).not.toHaveBeenCalled();
  });

  it("returns 500 when runConnectorImport throws (e.g. alto has no connector)", async () => {
    mocks.requireAgent.mockResolvedValue(AGENT_AUTH);
    mocks.runConnectorImport.mockRejectedValue(new Error("Unknown connector provider: alto"));

    const { POST } = await import("./route");
    const res = await POST(emptyRequest(), ROUTE_CONTEXT);

    expect(res.status).toBe(500);
    expect(mocks.setFeedIntegrationSyncStatus).not.toHaveBeenCalled();
  });
});
