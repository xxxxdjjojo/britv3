/**
 * API routes for referral tracker.
 * GET  /api/referrals — get stats (auto-creates code if none exists)
 * POST /api/referrals — explicitly create/get code, then return stats
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getReferralCode,
  createReferralCode,
  getReferralStats,
} from "@/services/referrals/referral-service";
import type { ReferralStats } from "@/services/referrals/referral-service";

/**
 * GET /api/referrals — Returns referral stats.
 * Auto-creates a referral code if the user doesn't have one.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-create code if missing
    const existing = await getReferralCode(supabase, user.id);
    if (!existing) {
      await createReferralCode(supabase, user.id);
    }

    const stats: ReferralStats = await getReferralStats(supabase, user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[referrals] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/referrals — Explicitly create or retrieve a referral code, then return stats.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await getReferralCode(supabase, user.id);
    if (!existing) {
      await createReferralCode(supabase, user.id);
    }

    const stats: ReferralStats = await getReferralStats(supabase, user.id);
    return NextResponse.json(stats, { status: 201 });
  } catch (error) {
    console.error("[referrals] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
