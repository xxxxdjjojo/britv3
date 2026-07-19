import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeVouchRequest } from "@/services/referrals/vouch-referral-service";

type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;
  await revokeVouchRequest(user.id, id);
  return NextResponse.json({ revoked: true });
}
