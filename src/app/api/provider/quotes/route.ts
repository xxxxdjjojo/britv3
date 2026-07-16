/**
 * /api/provider/quotes
 *
 * GET  — list quotes for the authenticated provider
 * POST — create a new quote (draft)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireProviderAccess } from "@/lib/api/provider-access";
import {
  createQuote,
  getQuotesByProvider,
} from "@/services/provider/provider-quote-service";
import type { QuoteStatus } from "@/services/provider/provider-quote-service";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  name: z.string().min(1, "Line item name is required"),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  unit_price_pence: z.number().int().min(0),
  total_pence: z.number().int().min(0),
});

const createQuoteSchema = z.object({
  service_request_id: z.string().uuid().optional(),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  valid_until_days: z.number().int().min(1).max(365).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/provider/quotes
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const access = await requireProviderAccess();
  if (access.response) return access.response;
  const { supabase, user } = access;

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const status = rawStatus as QuoteStatus | undefined;

  try {
    const quotes = await getQuotesByProvider(supabase, providerId, status ?? undefined);
    return NextResponse.json({ quotes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/provider/quotes
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const access = await requireProviderAccess();
  if (access.response) return access.response;
  const { supabase, user } = access;

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createQuoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const quote = await createQuote(supabase, providerId, parsed.data);
    return NextResponse.json(quote, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
