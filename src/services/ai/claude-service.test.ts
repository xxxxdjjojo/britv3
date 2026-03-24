import { describe, it, expect, vi, beforeEach } from "vitest";

// -- Mocks --------------------------------------------------------------------

const mockMessagesCreate = vi.fn();
const mockRatelimitLimit = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockGte = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(function () {
    return { messages: { create: mockMessagesCreate } };
  }),
}));

vi.mock("@upstash/ratelimit", () => {
  function RatelimitMock() {
    return { limit: mockRatelimitLimit };
  }
  RatelimitMock.slidingWindow = vi.fn().mockReturnValue("sliding-window-config");
  return { Ratelimit: RatelimitMock };
});

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(function () {
    return {};
  }),
}));

const mockGetCached = vi.fn();
const mockSetCache = vi.fn();
vi.mock("@/lib/cache/redis", () => ({
  getCached: (...args: unknown[]) => mockGetCached(...args),
  setCache: (...args: unknown[]) => mockSetCache(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

// -- Setup --------------------------------------------------------------------

function setupMocks() {
  // Default: rate limits pass
  mockRatelimitLimit.mockResolvedValue({ success: true });

  // Default: no daily spend (Redis cached spend = 0)
  mockGetCached.mockResolvedValue(null);
  mockSetCache.mockResolvedValue(undefined);

  // Default: Supabase from (for logUsage insert)
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === "ai_usage_log") {
      return {
        select: mockSelect.mockReturnValue({
          gte: mockGte.mockResolvedValue({ data: [], error: null }),
        }),
        insert: mockInsert.mockResolvedValue({ error: null }),
      };
    }
    return { select: vi.fn(), insert: vi.fn() };
  });

  // Default: successful Claude response
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: "Generated property description." }],
    usage: { input_tokens: 100, output_tokens: 200 },
  });
}

// -- Tests --------------------------------------------------------------------

describe("callClaude", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.AI_DAILY_SPEND_LIMIT = "10";
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    setupMocks();
  });

  const defaultOptions = {
    feature: "property_description" as const,
    userId: "user-123",
    systemPrompt: "You are a property description writer.",
    userMessage: "Describe this 3 bed house in London.",
  };

  it("returns text and token counts on successful call", async () => {
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    expect(result).not.toBeNull();
    expect(result!.text).toBe("Generated property description.");
    expect(result!.inputTokens).toBe(100);
    expect(result!.outputTokens).toBe(200);
  });

  it("returns null when rate limit is exceeded (does not throw)", async () => {
    mockRatelimitLimit.mockResolvedValue({ success: false });

    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    expect(result).toBeNull();
  });

  it("returns null when daily spend limit is exceeded", async () => {
    // Override Redis cached spend to exceed limit
    mockGetCached.mockResolvedValue(100); // $100 > $10 limit

    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    expect(result).toBeNull();
  });

  it("returns null when Anthropic API throws an error", async () => {
    mockMessagesCreate.mockRejectedValue(new Error("API down"));

    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    expect(result).toBeNull();
  });

  it("logs usage after a successful call", async () => {
    const { callClaude } = await import("./claude-service");
    await callClaude(defaultOptions);

    expect(mockSupabaseFrom).toHaveBeenCalledWith("ai_usage_log");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "property_description",
        user_id: "user-123",
        input_tokens: 100,
        output_tokens: 200,
      }),
    );
  });

  it("does NOT log usage after a failed call", async () => {
    mockMessagesCreate.mockRejectedValue(new Error("API down"));

    const { callClaude } = await import("./claude-service");
    await callClaude(defaultOptions);

    // insert should not be called (only select for daily spend check)
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
