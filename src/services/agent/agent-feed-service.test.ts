import { describe, expect, it, vi } from "vitest";
import {
  createFeedIntegration,
  getFeedIntegrations,
  updateFeedIntegration,
} from "./agent-feed-service";

function createReadChain(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn().mockResolvedValue(result),
  };

  return chain;
}

function createMutationChain(result: unknown) {
  const chain = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
  };

  return chain;
}

describe("agent-feed-service", () => {
  it("returns feed integration views without api_key_encrypted", async () => {
    const chain = createReadChain({
      data: [
        {
          id: "feed-1",
          agent_id: "agent-1",
          provider: "reapit",
          api_key_encrypted: "vault://agent-1/reapit/key",
          webhook_url: null,
          sync_status: "connected",
          last_sync_at: null,
          field_mapping: null,
          error_log: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const supabase = { from: vi.fn(() => chain) };

    const result = await getFeedIntegrations(supabase as never, "agent-1");

    expect(chain.select).toHaveBeenCalledWith(
      expect.not.stringContaining("api_key_encrypted"),
    );
    expect(result[0]).not.toHaveProperty("api_key_encrypted");
    expect(result[0]).toMatchObject({ id: "feed-1", has_secret: true });
  });

  it("stores only a server-side secret reference when creating feeds", async () => {
    const chain = createMutationChain({
      data: {
        id: "feed-1",
        agent_id: "agent-1",
        provider: "reapit",
        api_key_encrypted: "vault://agent-1/reapit/placeholder",
        webhook_url: null,
        sync_status: "disconnected",
        last_sync_at: null,
        field_mapping: null,
        error_log: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const supabase = { from: vi.fn(() => chain) };

    const result = await createFeedIntegration(supabase as never, "agent-1", {
      provider: "reapit",
      api_key: "secret-api-key",
    });
    const inserted = chain.insert.mock.calls[0][0] as {
      api_key_encrypted: string;
    };

    expect(inserted.api_key_encrypted).toMatch(/^vault:\/\/agent-1\/reapit\//);
    expect(inserted.api_key_encrypted).not.toBe(
      Buffer.from("secret-api-key").toString("base64"),
    );
    expect(result).not.toHaveProperty("api_key_encrypted");
    expect(result).toMatchObject({ id: "feed-1", has_secret: true });
  });

  it("does not allow generic updates to mutate sync_status", async () => {
    const chain = createMutationChain({
      data: {
        id: "feed-1",
        agent_id: "agent-1",
        provider: "reapit",
        api_key_encrypted: null,
        webhook_url: null,
        sync_status: "connected",
        last_sync_at: null,
        field_mapping: { price: "price" },
        error_log: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const supabase = { from: vi.fn(() => chain) };

    await updateFeedIntegration(supabase as never, "feed-1", "agent-1", {
      field_mapping: { price: "price" },
      sync_status: "syncing",
    } as never);
    const updated = chain.update.mock.calls[0][0] as Record<string, unknown>;

    expect(updated).toEqual({ field_mapping: { price: "price" } });
  });
});
