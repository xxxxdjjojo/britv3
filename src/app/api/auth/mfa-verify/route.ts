import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuthRateLimiter } from "@/lib/cache/redis";

// 5 MFA attempts per 15 minutes per user (fail-closed)
const mfaAttemptLimiter = createAuthRateLimiter(5, "15 m");

/**
 * POST /api/auth/mfa-verify
 * Server-side MFA verification with rate limiting.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit MFA attempts (fail-closed)
  const { success: allowed, remaining } = await mfaAttemptLimiter.limit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later.", locked: true },
      { status: 429 },
    );
  }

  let body: { factorId?: string; challengeId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { factorId, challengeId, code } = body;
  // Accept 6-digit TOTP codes or 8+ char backup codes
  if (!factorId || !challengeId || !code || code.length < 6) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Invalid code", remaining },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
