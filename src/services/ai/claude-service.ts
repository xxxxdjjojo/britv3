/**
 * Centralized AI service wrapper for Anthropic Claude API.
 *
 * Provides:
 * - Dual rate limiting (global + per-user) via Upstash
 * - Daily spend kill switch (Redis-cached counter)
 * - Token tracking / usage logging
 * - Input sanitization via sanitizeAiInput
 * - Zod output validation when outputSchema is provided
 * - Graceful degradation (returns null on any failure)
 */

import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeAiInput } from "@/lib/ai/sanitize";
import { getCached, setCache } from "@/lib/cache/redis";
import type { AiCallOptions, AiCallResult } from "./types";

const MODEL = "claude-haiku-4-5-20251001";

// Pricing per million tokens (Claude Haiku 4.5)
const INPUT_PRICE_PER_MILLION = 1.0; // $1.00 per 1M input tokens
const OUTPUT_PRICE_PER_MILLION = 5.0; // $5.00 per 1M output tokens

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
      console.error("[AI] Failed to log usage:", error);
    }
  } catch (err) {
    console.error("[AI] Usage logging error:", err);
  }
}

// -- Main API call wrapper ----------------------------------------------------

/**
 * Call Claude with cost controls, rate limiting, input sanitization,
 * and usage tracking. Optionally validates JSON output against a Zod schema.
 * Returns null on any failure -- callers should handle graceful degradation.
 */
export async function callClaude<T = unknown>(
  options: AiCallOptions<T>,
): Promise<AiCallResult<T> | null> {
  try {
    // 1. Check daily spend limit
    const dailyLimit = parseFloat(
      process.env.AI_DAILY_SPEND_LIMIT ?? "10",
    );
    const currentSpend = await getDailySpend();
    if (currentSpend >= dailyLimit) {
      console.warn("[AI] Daily spend limit reached:", currentSpend);
      return null;
    }

    // 2. Check global rate limit
    const globalResult = await getGlobalLimiter().limit("global");
    if (!globalResult.success) {
      console.warn("[AI] Global rate limit exceeded");
      return null;
    }

    // 3. Check per-user rate limit
    const userResult = await getUserLimiter().limit(options.userId);
    if (!userResult.success) {
      console.warn("[AI] User rate limit exceeded:", options.userId);
      return null;
    }

    // 4. Sanitize user input
    const sanitizedMessage = sanitizeAiInput(options.userMessage);

    // 5. Call Claude API
    const client = new Anthropic();
    const requestOptions = options.timeoutMs !== undefined
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

    // 6. Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[AI] No text block in response");
      return null;
    }

    // 7. Validate output via Zod schema if provided
    if (options.outputSchema) {
      try {
        const parsed = JSON.parse(textBlock.text);
        const validated = options.outputSchema.parse(parsed);
        await logUsage(options.feature, options.userId, response.usage.input_tokens, response.usage.output_tokens);
        await incrementDailySpend(response.usage.input_tokens, response.usage.output_tokens);
        return {
          text: textBlock.text,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          parsed: validated,
        };
      } catch (parseErr) {
        console.error("[AI] Output validation failed:", parseErr);
        return null;
      }
    }

    const result: AiCallResult<T> = {
      text: textBlock.text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    // 8. Log usage and update spend counter
    await logUsage(
      options.feature,
      options.userId,
      result.inputTokens,
      result.outputTokens,
    );
    await incrementDailySpend(result.inputTokens, result.outputTokens);

    return result;
  } catch (err) {
    console.error("[AI] callClaude error:", err);
    return null;
  }
}
