/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * POST /api/provider/quotes/suggest-items
 *
 * Uses Claude Haiku to suggest line items for a quote based on job title and category.
 * Always returns 200 — empty items array on any error for graceful degradation.
 *
 * TODO: Add Upstash Redis rate limiting (10 req / user / hour) once Redis env vars are live.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/services/ai/claude-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LineItemSuggestion = Readonly<{
  description: string;
  quantity: number;
  unit_price_gbp: number;
  vat_rate: 0 | 5 | 20;
}>;

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  jobTitle: z.string().min(1),
  category: z.string().optional(),
});

const lineItemSuggestionSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unit_price_gbp: z.number().min(0),
  vat_rate: z.union([z.literal(0), z.literal(5), z.literal(20)]),
});

const suggestionsResponseSchema = z.object({
  items: z.array(lineItemSuggestionSchema),
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  "You are a quoting assistant for a UK tradesperson. Generate realistic line items for a quote based on the job title and category. Use UK market rates. Respond with valid JSON only — no prose, no markdown.";

function buildUserMessage(jobTitle: string, category?: string): string {
  return `Generate 3–6 line items for this job:
Job title: ${jobTitle}${category ? `\nCategory: ${category}` : ""}

Return JSON with this exact shape:
{
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price_gbp": number,
      "vat_rate": 0 | 5 | 20
    }
  ]
}

Use sensible UK market rates. Apply VAT rate 20 for most labour/materials, 5 for energy-saving materials, 0 for exempt items.`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    // Return empty items — graceful degradation
    return NextResponse.json({ items: [] });
  }

  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ items: [] });
  }

  const { jobTitle, category } = parsed.data;

  try {
    const result = await callClaude({
      feature: "quote_suggest",
      userId: user.id,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserMessage(jobTitle, category),
      maxTokens: 512,
    });

    if (!result.ok) {
      return NextResponse.json({ items: [] });
    }

    // Strip potential markdown code fences
    const jsonText = result.data.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(jsonText);
    } catch {
      console.error("[suggest-items] Failed to parse AI JSON:", result.data.text);
      return NextResponse.json({ items: [] });
    }

    const validated = suggestionsResponseSchema.safeParse(rawParsed);
    if (!validated.success) {
      console.error("[suggest-items] AI response failed schema validation");
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: validated.data.items });
  } catch (err) {
    console.error("[suggest-items] Unexpected error:", err);
    return NextResponse.json({ items: [] });
  }
}
