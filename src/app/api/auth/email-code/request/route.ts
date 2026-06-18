import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAuthRateLimiter } from "@/lib/cache/redis";

// Fail-closed limiters: per-email and per-IP, to deter OTP abuse / enumeration.
const emailLimiter = createAuthRateLimiter(5, "1 h");
const ipLimiter = createAuthRateLimiter(15, "1 h");

const schema = z.object({ email: z.string().email() });

/**
 * Request a one-time email code (Supabase passwordless). The response is always
 * generic — it never reveals whether an account already exists. The OTP value is
 * never logged or returned.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const [emailOk, ipOk] = await Promise.all([
    emailLimiter.limit(`vmp:otp:email:${email}`),
    ipLimiter.limit(`vmp:otp:ip:${ip}`),
  ]);
  if (!emailOk.success || !ipOk.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  // shouldCreateUser: true both creates a new passwordless account and signs in
  // an existing one — identical response either way (no account enumeration).
  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

  return NextResponse.json({ ok: true });
}
