import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReferralDashboard } from "@/services/referrals/unified-referral-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ENG REVIEW 16A: Support ?all=true to fetch all referrals beyond default limit
  const url = new URL(request.url);
  const showAll = url.searchParams.get("all") === "true";

  try {
    const dashboard = await getReferralDashboard(supabase, user.id, {
      limit: showAll ? 1000 : undefined,
    });
    return NextResponse.json(dashboard);
  } catch (err) {
    console.error("[referrals] Failed to get dashboard:", err);
    return NextResponse.json({ error: "Failed to load referral data" }, { status: 500 });
  }
}
