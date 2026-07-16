/**
 * POST /api/kyc/session
 *
 * Starts an identity-verification session for the signed-in trader and
 * returns the hosted redirect URL. Persists kyc_status='pending' +
 * kyc_provider_ref BEFORE returning so the webhook can correlate.
 *
 * 409 when already verified or when the active provider has no hosted flow
 * (stub — the safe dark-launch default). Rate-limited per user because each
 * session costs money.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getKycProvider } from "@/services/verification/adapters/kyc-stub-adapter";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";
import type { KycSession } from "@/services/verification/kyc-provider";

export const dynamic = "force-dynamic";

const SESSIONS_PER_HOUR = 5;
const limiter = createInMemoryRateLimiter(SESSIONS_PER_HOUR, 3_600_000);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { success } = await limiter.limit(`kyc-session:${user.id}`);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts — try again later" }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("kyc_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.kyc_status === "verified") {
    return NextResponse.json({ error: "Identity already verified" }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  let session: KycSession;
  try {
    session = await getKycProvider().createSession({
      userId: user.id,
      email: user.email,
      returnUrl: `${origin}/dashboard/provider/verification?kyc=return`,
    });
  } catch {
    return NextResponse.json({ error: "Verification service unavailable" }, { status: 502 });
  }

  if (!session.redirectUrl) {
    return NextResponse.json({ error: "Identity verification is not available yet" }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ kyc_status: "pending", kyc_provider_ref: session.providerRef })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not start verification" }, { status: 500 });
  }

  return NextResponse.json({ redirectUrl: session.redirectUrl });
}
