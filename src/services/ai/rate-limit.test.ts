import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks so we can swap behaviour per test.
const { limitMock, captureExceptionMock } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock("../../lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: limitMock }),
}));

vi.mock("../../lib/observability/capture-exception", () => ({
  captureException: captureExceptionMock,
}));

describe("enforceAiRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    limitMock.mockReset();
    captureExceptionMock.mockReset();
  });

  it("returns ok=true with remaining/reset when allowed", async () => {
    // Arrange
    const resetAt = Date.now() + 60_000;
    limitMock.mockResolvedValueOnce({
      success: true,
      limit: 10,
      remaining: 7,
      reset: resetAt,
    });

    // Act
    const { enforceAiRateLimit } = await import("./rate-limit");
    const result = await enforceAiRateLimit("user-1", "quote_draft");

    // Assert
    expect(result).toEqual({ ok: true, remaining: 7, reset: resetAt });
    expect(limitMock).toHaveBeenCalledWith("user-1:quote_draft");
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("returns ok=false with rate_limited when limiter denies", async () => {
    // Arrange
    const resetAt = Date.now() + 120_000;
    limitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: resetAt,
    });

    // Act
    const { enforceAiRateLimit } = await import("./rate-limit");
    const result = await enforceAiRateLimit("user-2", "quote_draft");

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "rate_limited",
      limit: 10,
      remaining: 0,
      reset: resetAt,
    });
  });

  it("uses per-user keys so different users are isolated", async () => {
    // Arrange
    limitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 0,
    });

    // Act
    const { enforceAiRateLimit } = await import("./rate-limit");
    await enforceAiRateLimit("userA", "quote_draft");
    await enforceAiRateLimit("userB", "quote_draft");

    // Assert
    expect(limitMock).toHaveBeenNthCalledWith(1, "userA:quote_draft");
    expect(limitMock).toHaveBeenNthCalledWith(2, "userB:quote_draft");
  });

  it("fails open and reports to Sentry when Upstash throws", async () => {
    // Arrange
    const boom = new Error("upstash down");
    limitMock.mockRejectedValueOnce(boom);

    // Act
    const { enforceAiRateLimit, MAX_DAILY_DRAFTS } = await import(
      "./rate-limit"
    );
    const result = await enforceAiRateLimit("user-3", "quote_draft");

    // Assert
    expect(result).toEqual({
      ok: true,
      remaining: MAX_DAILY_DRAFTS,
      reset: 0,
    });
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      boom,
      expect.objectContaining({
        module: "ai",
        feature: "quote-draft",
        operation: "rate-limit",
        extra: expect.objectContaining({
          userId: "user-3",
          rateLimitFeature: "quote_draft",
        }),
      }),
    );
  });
});
