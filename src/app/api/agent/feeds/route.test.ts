import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getFeedIntegrations: vi.fn(),
  createFeedIntegration: vi.fn(),
  updateFeedIntegration: vi.fn(),
  deleteFeedIntegration: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/services/agent/agent-feed-service", () => ({
  getFeedIntegrations: mocks.getFeedIntegrations,
  createFeedIntegration: mocks.createFeedIntegration,
  updateFeedIntegration: mocks.updateFeedIntegration,
  deleteFeedIntegration: mocks.deleteFeedIntegration,
}));

function createSupabaseClient({
  user = { id: "agent-1" },
  activeRole = "agent",
}: {
  user?: { id: string } | null;
  activeRole?: string | null;
} = {}) {
  const profileChain = {
    select: vi.fn(() => profileChain),
    eq: vi.fn(() => profileChain),
    single: vi.fn().mockResolvedValue({
      data: activeRole ? { active_role: activeRole } : null,
      error: null,
    }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return profileChain;
      }

      return {};
    }),
  };
}

function jsonRequest(path: string, body: unknown): NextRequest {
  return new Request(`http://localhost${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("/api/agent/feeds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mocks.createClient.mockResolvedValue(createSupabaseClient({ user: null }));

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 403 when the authenticated user is not an active agent", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabaseClient({ activeRole: "landlord" }),
    );

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(403);
    expect(mocks.getFeedIntegrations).not.toHaveBeenCalled();
  });

  it("redacts api_key_encrypted from GET responses defensively", async () => {
    mocks.createClient.mockResolvedValue(createSupabaseClient());
    mocks.getFeedIntegrations.mockResolvedValue([
      {
        id: "feed-1",
        agent_id: "agent-1",
        provider: "reapit",
        api_key_encrypted: "vault://agent-1/reapit/key",
        has_secret: true,
        webhook_url: null,
        sync_status: "connected",
        last_sync_at: null,
        field_mapping: null,
        error_log: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<Record<string, unknown>>;
    expect(body[0]).not.toHaveProperty("api_key_encrypted");
    expect(body[0]).toHaveProperty("has_secret", true);
  });

  it("requires PATCH id in the JSON body", async () => {
    mocks.createClient.mockResolvedValue(createSupabaseClient());

    const { PATCH } = await import("./route");
    const response = await PATCH(
      jsonRequest("/api/agent/feeds?id=7d04c68a-048a-4e45-b78b-e3e37542ed4f", {
        field_mapping: { price: "property.price" },
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateFeedIntegration).not.toHaveBeenCalled();
  });

  it("rejects client attempts to mutate sync_status", async () => {
    mocks.createClient.mockResolvedValue(createSupabaseClient());

    const { PATCH } = await import("./route");
    const response = await PATCH(
      jsonRequest("/api/agent/feeds", {
        id: "7d04c68a-048a-4e45-b78b-e3e37542ed4f",
        sync_status: "syncing",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateFeedIntegration).not.toHaveBeenCalled();
  });

  it("passes validated PATCH body ids to the service", async () => {
    mocks.createClient.mockResolvedValue(createSupabaseClient());
    mocks.updateFeedIntegration.mockResolvedValue({
      id: "7d04c68a-048a-4e45-b78b-e3e37542ed4f",
      agent_id: "agent-1",
      provider: "reapit",
      has_secret: true,
      webhook_url: null,
      sync_status: "connected",
      last_sync_at: null,
      field_mapping: { price: "property.price" },
      error_log: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      jsonRequest("/api/agent/feeds", {
        id: "7d04c68a-048a-4e45-b78b-e3e37542ed4f",
        field_mapping: { price: "property.price" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateFeedIntegration).toHaveBeenCalledWith(
      expect.anything(),
      "7d04c68a-048a-4e45-b78b-e3e37542ed4f",
      "agent-1",
      { field_mapping: { price: "property.price" } },
    );
  });
});
