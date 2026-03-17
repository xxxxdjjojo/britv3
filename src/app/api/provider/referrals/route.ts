/**
 * /api/provider/referrals
 *
 * GET — return { referral_code, stats, referrals } for the authenticated provider.
 * Creates the referral code row if one does not yet exist.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getReferralCode,
  getReferralStats,
  getReferrals,
} from "@/services/provider/provider-referral-service";

// ---------------------------------------------------------------------------
// GET /api/provider/referrals
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId: string = profile?.id ?? user.id;

  try {
    const [referral_code, stats, referrals] = await Promise.all([
      getReferralCode(supabase, providerId),
      getReferralStats(supabase, providerId),
      getReferrals(supabase, providerId),
    ]);

    return NextResponse.json({ referral_code, stats, referrals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
