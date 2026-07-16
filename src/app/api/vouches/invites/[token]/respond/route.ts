import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { respondToVouch } from "@/services/referrals/vouch-referral-service";

const schema = z.object({ decision: z.enum(["accept", "decline"]), publicAttributionConsent: z.boolean().optional() });
type Context = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const { token } = await context.params;
    const result = await respondToVouch({ token, actorProfileId: user.id, ...parsed.data });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to respond" }, { status: 409 });
  }
}
