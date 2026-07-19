import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createReferralInvite } from "@/services/referrals/vouch-referral-service";

const schema = z.object({ invitedEmail: z.string().trim().email().max(254) });
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const invite = await createReferralInvite({ referrerId: user.id, ...parsed.data });
  return NextResponse.json(invite, { status: 201 });
}
