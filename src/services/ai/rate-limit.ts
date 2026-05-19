import { createRateLimiter } from "@/lib/cache/redis";
import { captureException } from "@/lib/observability/capture-exception";

export const MAX_DAILY_DRAFTS = 10;

export type RateLimitResult =
  | { ok: true; remaining: number; reset: number }
  | {
      ok: false;
      reason: "rate_limited";
      limit: number;
      remaining: number;
      reset: number;
    };

const limiter = createRateLimiter(MAX_DAILY_DRAFTS, "1 d");

export async function enforceAiRateLimit(
  userId: string,
  feature: string,
): Promise<RateLimitResult> {
  try {
    const key = `${userId}:${feature}`;
    const result = await limiter.limit(key);
    if (!result.success) {
      return {
        ok: false,
        reason: "rate_limited",
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }
    return { ok: true, remaining: result.remaining, reset: result.reset };
  } catch (error) {
    captureException(error, {
      module: "ai",
      feature: "quote-draft",
      operation: "rate-limit",
      extra: { userId, rateLimitFeature: feature },
    });
    // Fail open: don't block legitimate users on Upstash outage
    return { ok: true, remaining: MAX_DAILY_DRAFTS, reset: 0 };
  }
}
