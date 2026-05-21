import { describe, it, expect, vi, beforeEach } from "vitest";

// -- Hoisted mocks (rebound per test) ----------------------------------------

const {
  mockMessagesCreate,
  mockRatelimitLimit,
  mockSupabaseFrom,
  mockInsert,
  mockSelect,
  mockGte,
  mockGetCached,
  mockSetCache,
  captureExceptionMock,
} = vi.hoisted(() => ({
  mockMessagesCreate: vi.fn(),
  mockRatelimitLimit: vi.fn(),
  mockSupabaseFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockGte: vi.fn(),
  mockGetCached: vi.fn(),
  mockSetCache: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

// Use a hoisted error-class registry so tests can throw real instances and
// `instanceof` narrowing inside `claude-service.ts` works.
class FakeAPIError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}
class FakeRateLimitError extends FakeAPIError {
  constructor(message = "rate limited") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}
class FakeAuthenticationError extends FakeAPIError {
  constructor(message = "unauth") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}
class FakeBadRequestError extends FakeAPIError {
  constructor(message = "bad request") {
    super(message, 400);
    this.name = "BadRequestError";
  }
}
class FakeAPIConnectionError extends FakeAPIError {
  constructor(message = "connection error") {
    super(message);
    this.name = "APIConnectionError";
  }
}
class FakeAPIConnectionTimeoutError extends FakeAPIConnectionError {
  constructor(message = "timeout") {
    super(message);
    this.name = "APIConnectionTimeoutError";
  }
}
class FakeAnthropicError extends Error {
  constructor(message = "anthropic error") {
    super(message);
    this.name = "AnthropicError";
  }
}

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(function () {
    return { messages: { create: mockMessagesCreate } };
  }),
  APIError: FakeAPIError,
  RateLimitError: FakeRateLimitError,
  AuthenticationError: FakeAuthenticationError,
  BadRequestError: FakeBadRequestError,
  APIConnectionError: FakeAPIConnectionError,
  APIConnectionTimeoutError: FakeAPIConnectionTimeoutError,
  AnthropicError: FakeAnthropicError,
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

vi.mock("../../lib/cache/redis", () => ({
  getCached: (...args: unknown[]) => mockGetCached(...args),
  setCache: (...args: unknown[]) => mockSetCache(...args),
}));

vi.mock("../../lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockSupabaseFrom })),
}));

vi.mock("../../lib/observability/capture-exception", () => ({
  captureException: captureExceptionMock,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

// -- Test fixtures -----------------------------------------------------------

const defaultOptions = {
  feature: "property_description" as const,
  userId: "user-123",
  systemPrompt: "You are a property description writer.",
  userMessage: "Describe this 3 bed house in London.",
};

function setupDefaultMocks() {
  // Rate limits pass by default
  mockRatelimitLimit.mockResolvedValue({ success: true });

  // No daily spend
  mockGetCached.mockResolvedValue(null);
  mockSetCache.mockResolvedValue(undefined);

  // Supabase from (for ai_usage_log insert)
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
    stop_reason: "end_turn",
    usage: { input_tokens: 100, output_tokens: 200 },
  });
}

// -- Tests --------------------------------------------------------------------

describe("callClaude (typed result)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    captureExceptionMock.mockReset();
    process.env.AI_DAILY_SPEND_LIMIT = "10";
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    setupDefaultMocks();
  });

  it("returns ok=true with text and token counts on happy path", async () => {
    // Arrange — defaults already set

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.text).toBe("Generated property description.");
      expect(result.data.inputTokens).toBe(100);
      expect(result.data.outputTokens).toBe(200);
    }
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("returns reason=refusal when Anthropic stop_reason is 'refusal'", async () => {
    // Arrange
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "I cannot help with that." }],
      stop_reason: "refusal",
      usage: { input_tokens: 30, output_tokens: 10 },
    });

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "refusal",
      userMessage: expect.stringMatching(/declined/i),
    });
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        module: "ai",
        feature: "callClaude",
        extra: expect.objectContaining({ reason: "refusal" }),
      }),
    );
  });

  it("returns reason=no_text_block when response has no text block", async () => {
    // Arrange
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "tool_use", id: "tu_1", name: "foo", input: {} }],
      stop_reason: "tool_use",
      usage: { input_tokens: 30, output_tokens: 10 },
    });

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no_text_block");
    }
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "no_text_block" }),
      }),
    );
  });

  it("returns reason=malformed_output when output schema parse fails", async () => {
    // Arrange — text block is not valid JSON, but a schema is provided
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "this is not json" }],
      stop_reason: "end_turn",
      usage: { input_tokens: 30, output_tokens: 10 },
    });
    const { z } = await import("zod");
    const schema = z.object({ items: z.array(z.string()) });

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude({
      ...defaultOptions,
      outputSchema: schema,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("malformed_output");
    }
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "malformed_output" }),
      }),
    );
  });

  it("returns reason=rate_limit when Anthropic throws RateLimitError", async () => {
    // Arrange
    mockMessagesCreate.mockRejectedValue(new FakeRateLimitError("429"));

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("rate_limit");
    }
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "rate_limit" }),
      }),
    );
  });

  it("returns reason=overloaded when Anthropic throws APIError with status 529", async () => {
    // Arrange
    mockMessagesCreate.mockRejectedValue(
      new FakeAPIError("overloaded", 529),
    );

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("overloaded");
    }
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "overloaded" }),
      }),
    );
  });

  it("returns reason=auth when Anthropic throws AuthenticationError", async () => {
    // Arrange
    mockMessagesCreate.mockRejectedValue(new FakeAuthenticationError());

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("auth");
    }
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "auth" }),
      }),
    );
  });

  it("returns reason=unknown when Anthropic throws a generic Error", async () => {
    // Arrange
    mockMessagesCreate.mockRejectedValue(new Error("something went wrong"));

    // Act
    const { callClaude } = await import("./claude-service");
    const result = await callClaude(defaultOptions);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("unknown");
    }
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "unknown" }),
      }),
    );
  });
});
