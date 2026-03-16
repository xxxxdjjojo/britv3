/**
 * Test 8: API key generation
 * Tests generateApiKey():
 * - key is returned to caller
 * - key hash (not plaintext) is stored in DB
 * - key has correct prefix format (bsa_)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { generateApiKey } from "@/services/agent/agent-billing-service";

describe("generateApiKey", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it("Test 8a: returns a full key and id to the caller", async () => {
    const agentId = "agent-001";
    const name = "My integration key";
    const mockInsertedRow = {
      id: "key-row-001",
      agent_id: agentId,
      key_prefix: "bsa_abcd",
      name,
      is_active: true,
      rate_limit_per_minute: 60,
      usage_count: 0,
    };

    const queryBuilder = mockClient.from("agent_api_keys");
    (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockInsertedRow,
      error: null,
    });

    const result = await generateApiKey(mockClient as never, agentId, name);

    expect(result.key).toBeDefined();
    expect(typeof result.key).toBe("string");
    expect(result.key.length).toBeGreaterThan(10);
    expect(result.id).toBe("key-row-001");
  });

  it("Test 8b: key starts with 'bsa_' prefix", async () => {
    const agentId = "agent-001";
    const mockInsertedRow = {
      id: "key-row-002",
      agent_id: agentId,
      key_prefix: "bsa_",
      name: "test",
      is_active: true,
      rate_limit_per_minute: 60,
      usage_count: 0,
    };

    const queryBuilder = mockClient.from("agent_api_keys");
    (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockInsertedRow,
      error: null,
    });

    const result = await generateApiKey(mockClient as never, agentId, "test");

    expect(result.key.startsWith("bsa_")).toBe(true);
  });

  it("Test 8c: key_hash stored in DB differs from the returned plaintext key", async () => {
    const agentId = "agent-001";
    let capturedInsertPayload: Record<string, unknown> | null = null;

    // Intercept insert call to capture the payload written to DB
    mockClient.from = vi.fn().mockImplementation(() => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          capturedInsertPayload = payload;
          return builder;
        }),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-row-003",
            agent_id: agentId,
            key_prefix: "bsa_",
            name: "my-key",
            is_active: true,
            rate_limit_per_minute: 60,
            usage_count: 0,
          },
          error: null,
        }),
      };
      return builder;
    });

    const result = await generateApiKey(mockClient as never, agentId, "my-key");

    // The DB payload should contain key_hash, not the raw key
    expect(capturedInsertPayload).not.toBeNull();
    const payload = capturedInsertPayload as Record<string, unknown>;
    expect(payload["key_hash"]).toBeDefined();
    // key_hash must NOT equal the returned plaintext key
    expect(payload["key_hash"]).not.toBe(result.key);
    // key_hash should look like a hex SHA-256 (64 chars)
    expect(typeof payload["key_hash"]).toBe("string");
    expect((payload["key_hash"] as string).length).toBe(64);
  });
});
