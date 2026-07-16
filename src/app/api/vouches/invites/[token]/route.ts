import { NextResponse, type NextRequest } from "next/server";
import { getVouchInvite } from "@/services/referrals/vouch-referral-service";

type Context = { params: Promise<{ token: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, context: Context) {
  const { token } = await context.params;
  if (!UUID.test(token)) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  const invite = await getVouchInvite(token);
  if (!invite) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return NextResponse.json(invite);
}
