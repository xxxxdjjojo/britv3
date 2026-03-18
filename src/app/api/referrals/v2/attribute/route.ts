import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { attributeReferral } from "@/services/referrals/unified-referral-service";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ENG REVIEW 6A: Read httpOnly cookie server-side
  const cookieStore = await cookies();
  const refCode = cookieStore.get("britestate_ref")?.value;

  if (!refCode) {
    return NextResponse.json({ attributed: false, reason: "no_cookie" });
  }

  try {
    await attributeReferral(supabase, refCode, user.id);

    // Clear the cookie after attribution
    cookieStore.delete("britestate_ref");

    return NextResponse.json({ attributed: true });
  } catch (err) {
    console.error("[referral] Attribution failed:", err);
    return NextResponse.json({ error: "Attribution failed" }, { status: 500 });
  }
}
