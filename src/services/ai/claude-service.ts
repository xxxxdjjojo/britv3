/**
 * Centralized AI service wrapper for Anthropic Claude API.
 *
 * Provides:
 * - Dual rate limiting (global + per-user) via Upstash
 * - Daily spend kill switch (Redis-cached counter)
 * - Token tracking / usage logging
 * - Input sanitization via sanitizeAiInput
 * - Zod output validation when outputSchema is provided
 * - Typed discriminated-union failure surface so callers can render
 *   user-safe fallback messages instead of generic 500s.
 */

import Anthropic, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeAiInput } from "@/lib/ai/sanitize";
import { getCached, setCache } from "@/lib/cache/redis";
import { captureException } from "@/lib/observability/capture-exception";
import type { AiCallOptions, AiCallResult } from "./types";

const MODEL = "claude-haiku-4-5-20251001";

// Pricing per million tokens (Claude Haiku 4.5)
const INPUT_PRICE_PER_MILLION = 1.0; // $1.00 per 1M input tokens
const OUTPUT_PRICE_PER_MILLION = 5.0; // $5.00 per 1M output tokens

// -- Typed failure surface ---------------------------------------------------

export type CallClaudeFailureReason =
  | "daily_spend_exhausted"
  | "global_rate_limit"
  | "user_rate_limit"
  | "rate_limit"
  | "overloaded"
  | "auth"
  | "bad_request"
  | "timeout"
  | "connection"
  | "no_text_block"
  | "malformed_output"
  | "refusal"
  | "unknown";

export type CallClaudeFailure = Readonly<{
  ok: false;
  reason: CallClaudeFailureReason;
  userMessage: string;
}>;

export type CallClaudeSuccess<T> = Readonly<{
  ok: true;
  data: AiCallResult<T>;
}>;

export type CallClaudeResult<T> = CallClaudeSuccess<T> | CallClaudeFailure;

const USER_MESSAGES: Readonly<Record<CallClaudeFailureReason, string>> = {
  daily_spend_exhausted:
    "AI is temporarily unavailable due to high usage today. Please try again tomorrow.",
  global_rate_limit:
    "AI service is busy right now. Please try again in a moment.",
  user_rate_limit: "You've reached your AI usage limit for today.",
  rate_limit: "AI service is busy right now. Please try again in a moment.",
  overloaded: "AI service is overloaded. Please try again in a moment.",
  auth: "AI service is temporarily unavailable. Please try again later.",
  bad_request:
    "We couldn't process that request. Please try again with different input.",
  timeout: "AI service took too long to respond. Please try again.",
  connection:
    "We couldn't reach the AI service. Please check your connection and try again.",
  no_text_block: "AI returned an unexpected response. Please try again.",
  malformed_output: "AI returned an unexpected response. Please try again.",
  refusal:
    "AI declined to respond to that request. Try rephrasing or use a different approach.",
  unknown: "AI service is temporarily unavailable. Please try again later.",
};

function failure(reason: CallClaudeFailureReason): CallClaudeFailure {
  return { ok: false, reason, userMessage: USER_MESSAGES[reason] };
}

// -- Rate limiters (lazy-initialized) -----------------------------------------

let globalLimiter: Ratelimit | null = null;
let userLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function getGlobalLimiter(): Ratelimit {
  if (!globalLimiter) {
    globalLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "ai:global",
    });
  }
  return globalLimiter;
}

function getUserLimiter(): Ratelimit {
  if (!userLimiter) {
    userLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "ai:user",
    });
  }
  return userLimiter;
}

// -- Daily spend tracking (Redis-cached) --------------------------------------

const DAILY_SPEND_KEY = "ai:daily_spend";
const DAILY_SPEND_TTL_SECONDS = 86_400;

/**
 * Get today's total AI spend from Redis cache.
 * Returns cost in USD.
 */
export async function getDailySpend(): Promise<number> {
  const cached = await getCached<number>(DAILY_SPEND_KEY);
  return cached ?? 0;
}

async function incrementDailySpend(inputTokens: number, outputTokens: number): Promise<void> {
  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
  const cost = inputCost + outputCost;
  const current = await getDailySpend();
  await setCache(DAILY_SPEND_KEY, current + cost, DAILY_SPEND_TTL_SECONDS);
}

// -- Usage logging ------------------------------------------------------------

async function logUsage(
  feature: string,
  userId: string,
  inputTokens: number,
  outputTokens: number,
  listingId?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("ai_usage_log").insert({
      feature,
      model: MODEL,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      user_id: userId,
      listing_id: listingId ?? null,
    });
    if (error) {
      captureException(error, {
        module: "ai",
        feature: "callClaude",
        operation: "log-usage",
      });
    }
  } catch (err) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "log-usage",
    });
  }
}

// -- Main API call wrapper ----------------------------------------------------

/**
 * Call Claude with cost controls, rate limiting, input sanitization,
 * and usage tracking. Optionally validates JSON output against a Zod schema.
 *
 * Returns a discriminated union: `{ ok: true, data }` on success, or
 * `{ ok: false, reason, userMessage }` on any failure. Callers should branch
 * on `result.ok` and surface `result.userMessage` for graceful degradation.
 */
export async function callClaude<T = unknown>(
  options: AiCallOptions<T>,
): Promise<CallClaudeResult<T>> {
  // 1. Check daily spend limit
  const dailyLimit = parseFloat(process.env.AI_DAILY_SPEND_LIMIT ?? "10");
  const currentSpend = await getDailySpend();
  if (currentSpend >= dailyLimit) {
    captureException(new Error("AI daily spend limit reached"), {
      module: "ai",
      feature: "callClaude",
      operation: "daily-spend-check",
      extra: { reason: "daily_spend_exhausted", currentSpend, dailyLimit },
    });
    return failure("daily_spend_exhausted");
  }

  // 2. Check global rate limit
  const globalResult = await getGlobalLimiter().limit("global");
  if (!globalResult.success) {
    captureException(new Error("AI global rate limit exceeded"), {
      module: "ai",
      feature: "callClaude",
      operation: "global-rate-limit",
      extra: { reason: "global_rate_limit" },
    });
    return failure("global_rate_limit");
  }

  // 3. Check per-user rate limit
  const userResult = await getUserLimiter().limit(options.userId);
  if (!userResult.success) {
    captureException(new Error("AI user rate limit exceeded"), {
      module: "ai",
      feature: "callClaude",
      operation: "user-rate-limit",
      extra: { reason: "user_rate_limit", userId: options.userId },
    });
    return failure("user_rate_limit");
  }

  // 4. Sanitize user input
  const sanitizedMessage = sanitizeAiInput(options.userMessage);

  // 5. Call Claude API
  try {
    const client = new Anthropic();
    const requestOptions =
      options.timeoutMs !== undefined
        ? { signal: AbortSignal.timeout(options.timeoutMs) }
        : undefined;
    const response = await client.messages.create(
      {
        model: options.model ?? MODEL,
        max_tokens: options.maxTokens ?? 1024,
        system: options.systemPrompt,
        messages: [{ role: "user", content: sanitizedMessage }],
      },
      requestOptions,
    );

    // 6. Refusal check (before text-block extraction)
    if (response.stop_reason === "refusal") {
      captureException(new Error("Anthropic refused to respond"), {
        module: "ai",
        feature: "callClaude",
        operation: "anthropic-call",
        extra: { reason: "refusal", stopReason: response.stop_reason },
      });
      return failure("refusal");
    }

    // 7. Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      captureException(new Error("No text block in Anthropic response"), {
        module: "ai",
        feature: "callClaude",
        operation: "anthropic-call",
        extra: { reason: "no_text_block" },
      });
      return failure("no_text_block");
    }

    // 8. Validate output via Zod schema if provided
    if (options.outputSchema) {
      try {
        const parsed = JSON.parse(textBlock.text);
        const validated = options.outputSchema.parse(parsed);
        await logUsage(
          options.feature,
          options.userId,
          response.usage.input_tokens,
          response.usage.output_tokens,
        );
        await incrementDailySpend(
          response.usage.input_tokens,
          response.usage.output_tokens,
        );
        return {
          ok: true,
          data: {
            text: textBlock.text,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            parsed: validated,
          },
        };
      } catch (parseErr) {
        captureException(parseErr, {
          module: "ai",
          feature: "callClaude",
          operation: "output-validation",
          extra: { reason: "malformed_output" },
        });
        return failure("malformed_output");
      }
    }

    const result: AiCallResult<T> = {
      text: textBlock.text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    // 9. Log usage and update spend counter
    await logUsage(
      options.feature,
      options.userId,
      result.inputTokens,
      result.outputTokens,
    );
    await incrementDailySpend(result.inputTokens, result.outputTokens);

    return { ok: true, data: result };
  } catch (err) {
    return mapAnthropicError(err);
  }
}

/**
 * Narrow an Anthropic SDK / network error into a typed failure result.
 * Always reports to Sentry with a `reason` tag for triage.
 */
function mapAnthropicError(err: unknown): CallClaudeFailure {
  if (err instanceof RateLimitError) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "anthropic-call",
      extra: { reason: "rate_limit" },
    });
    return failure("rate_limit");
  }
  if (err instanceof AuthenticationError) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "anthropic-call",
      extra: { reason: "auth" },
    });
    return failure("auth");
  }
  if (err instanceof BadRequestError) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "anthropic-call",
      extra: { reason: "bad_request" },
    });
    return failure("bad_request");
  }
  if (err instanceof APIConnectionTimeoutError) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "anthropic-call",
      extra: { reason: "timeout" },
    });
    return failure("timeout");
  }
  if (err instanceof APIConnectionError) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "anthropic-call",
      extra: { reason: "connection" },
    });
    return failure("connection");
  }
  // Overloaded — HTTP 529 surfaces as APIError (no dedicated class)
  if (err instanceof APIError && err.status === 529) {
    captureException(err, {
      module: "ai",
      feature: "callClaude",
      operation: "anthropic-call",
      extra: { reason: "overloaded" },
    });
    return failure("overloaded");
  }
  captureException(err, {
    module: "ai",
    feature: "callClaude",
    operation: "anthropic-call",
    extra: { reason: "unknown" },
  });
  return failure("unknown");
}
