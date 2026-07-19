/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { attributeReferralAfterAuthentication } from "@/services/referrals/vouch-referral-service";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ENG REVIEW 6A: Read httpOnly cookie server-side
  const cookieStore = await cookies();
  const refCode = cookieStore.get("britestate_ref")?.value;
  const inviteToken = cookieStore.get("truedeed_invite")?.value;

  if (!refCode && !inviteToken) {
    return NextResponse.json({ attributed: false, reason: "no_cookie" });
  }

  try {
    const result = await attributeReferralAfterAuthentication({
      userId: user.id,
      referralCode: refCode,
      inviteToken,
    });

    // Clear the cookie after attribution
    cookieStore.delete("britestate_ref");
    cookieStore.delete("truedeed_invite");

    return NextResponse.json(result);
  } catch (err) {
    console.error("[referral] Attribution failed:", err);
    return NextResponse.json({ error: "Attribution failed" }, { status: 500 });
  }
}
