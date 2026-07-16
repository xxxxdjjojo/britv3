import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthRateLimiter } from "@/lib/cache/redis";
import { claimSessionToUser } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";
import { captureException } from "@/lib/observability/capture-exception";
import { attributeReferralAfterAuthentication } from "@/services/referrals/vouch-referral-service";

const verifyLimiter = createAuthRateLimiter(8, "10 m");

const schema = z.object({
  email: z.string().email(),
  token: z.string().regex(/^\d{6}$/),
});

/** Verify the one-time code, create/sign-in the account, claim the pending valuation. */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const bypassRateLimit =
    process.env.NODE_ENV !== "production" && process.env.VMP_E2E_RATELIMIT_OFF === "1";
  if (!bypassRateLimit) {
    const limited = await verifyLimiter.limit(`vmp:otp:verify:${email}`);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: parsed.data.token,
    type: "email",
  });
  if (error || !data.user) {
    return NextResponse.json({ error: "That code is invalid or has expired." }, { status: 400 });
  }
  const user = data.user;
  const cookieStore = await cookies();
  let referralAttributionComplete = false;

  // Best-effort account seeding (non-fatal): give the new user a default role.
  try {
    const admin = createAdminClient();
    await admin.from("profiles").upsert({ id: user.id, active_role: "seller" }, { onConflict: "id", ignoreDuplicates: true });
    await admin.from("user_roles").insert({ user_id: user.id, role: "seller" });
  } catch {
    // ignore — the valuation does not depend on profile seeding
  }

  // OTP verification establishes the same authenticated boundary as the OAuth
  // callback. Claim attribution here, and retain first-touch cookies on a
  // transient failure so a later authenticated retry can complete it.
  try {
    const attribution = await attributeReferralAfterAuthentication({
      userId: user.id,
      referralCode: cookieStore.get("britestate_ref")?.value,
      inviteToken: cookieStore.get("truedeed_invite")?.value,
    });
    referralAttributionComplete =
      attribution.attributed || attribution.outcome === "already_attributed";
  } catch (err) {
    captureException(err, {
      module: "referrals",
      feature: "signup-attribution",
      route: "/api/auth/email-code/verify",
      operation: "otp-session",
    });
  }

  // Attach the anonymous pending valuation to the now-verified user.
  let resultId: string | null = null;
  try {
    const vmpToken = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
    resultId = vmpToken ? await claimSessionToUser(vmpToken, user.id) : null;
  } catch (err) {
    captureException(err, {
      module: "valuation",
      feature: "otp-claim",
      route: "/api/auth/email-code/verify",
      operation: "claimSessionToUser",
    });
  }
  // The account is verified even if valuation attachment or attribution is
  // temporarily unavailable.
  const response = NextResponse.json({ ok: true, resultId });
  if (referralAttributionComplete) {
    response.cookies.delete("britestate_ref");
    response.cookies.delete("truedeed_invite");
  }
  return response;
}
