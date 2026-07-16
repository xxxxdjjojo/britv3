/**
 * /api/provider/boost
 *
 * GET  — return active boosts for the authenticated provider
 * POST — validate request, call createBoostCheckout, return { checkout_url }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import {
  getActiveBoosts,
  createBoostCheckout,
} from "@/services/provider/provider-boost-service";
import type { BoostType } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const VALID_BOOST_TYPES: BoostType[] = [
  "featured_profile",
  "area_spotlight",
  "category_top",
];

const DURATION_WEEKS_TO_DAYS: Record<number, number> = {
  1: 7,
  2: 14,
  4: 28,
};

const postSchema = z.object({
  boost_type: z.enum(["featured_profile", "area_spotlight", "category_top"] as const),
  duration_weeks: z.number().int().refine((v) => v in DURATION_WEEKS_TO_DAYS, {
    message: "duration_weeks must be 1, 2, or 4",
  }),
  amount_pence: z.number().int().min(1),
  coverage_area: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function resolveProvider() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, providerId: null };
  }

  const { data: profile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId: string = profile?.id ?? user.id;
  return { supabase, user, providerId };
}

// ---------------------------------------------------------------------------
// GET /api/provider/boost
// ---------------------------------------------------------------------------

export async function GET() {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { supabase, user, providerId } = await resolveProvider();

  if (!user || !providerId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const boosts = await getActiveBoosts(supabase, providerId);
    return NextResponse.json({ boosts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/provider/boost
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { supabase: _supabase, user, providerId } = await resolveProvider();

  if (!user || !providerId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Validate FEATURE_STRIPE_CONNECT_ENABLED
  if (process.env.FEATURE_STRIPE_CONNECT_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Stripe is not enabled in this environment." },
      { status: 503 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { boost_type, duration_weeks, amount_pence, coverage_area } = parsed.data;
  const duration_days = DURATION_WEEKS_TO_DAYS[duration_weeks] ?? 7;

  // Validate boost_type is in the valid list (belt-and-suspenders)
  if (!VALID_BOOST_TYPES.includes(boost_type)) {
    return NextResponse.json({ error: "Invalid boost_type" }, { status: 400 });
  }

  try {
    const result = await createBoostCheckout(providerId, {
      boost_type,
      duration_days,
      amount_pence,
      coverage_area,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
