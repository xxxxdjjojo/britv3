/**
 * Centralized AI service wrapper for Anthropic Claude API.
 *
 * Provides:
 * - Dual rate limiting (global + per-user) via Upstash
 * - Daily spend kill switch
 * - Token tracking / usage logging
 * - Graceful degradation (returns null on any failure)
 */

import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";
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

// -- Daily spend tracking -----------------------------------------------------

/**
 * Query today's total AI spend from the ai_usage_log table.
 * Returns cost in USD.
 */
export async function getDailySpend(): Promise<number> {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_usage_log")
    .select("input_tokens, output_tokens")
    .gte("created_at", todayStart.toISOString());

  if (error || !data) {
    console.error("[AI] Failed to query daily spend:", error);
    return 0;
  }

  return data.reduce((total, row) => {
    const inputCost = (row.input_tokens / 1_000_000) * INPUT_PRICE_PER_MILLION;
    const outputCost = (row.output_tokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
    return total + inputCost + outputCost;
  }, 0);
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
 * Call Claude with cost controls, rate limiting, and usage tracking.
 * Returns null on any failure -- callers should handle graceful degradation.
 */
export async function callClaude(
  options: AiCallOptions,
): Promise<AiCallResult | null> {
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

    // 4. Call Claude API
    const client = new Anthropic();
    const requestOptions = options.timeoutMs !== undefined
      ? { signal: AbortSignal.timeout(options.timeoutMs) }
      : undefined;
    const response = await client.messages.create(
      {
        model: options.model ?? MODEL,
        max_tokens: options.maxTokens ?? 1024,
        system: options.systemPrompt,
        messages: [{ role: "user", content: options.userMessage }],
      },
      requestOptions,
    );

    // 5. Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[AI] No text block in response");
      return null;
    }

    const result: AiCallResult = {
      text: textBlock.text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    // 6. Log usage
    await logUsage(
      options.feature,
      options.userId,
      result.inputTokens,
      result.outputTokens,
    );

    return result;
  } catch (err) {
    console.error("[AI] callClaude error:", err);
    return null;
  }
}
