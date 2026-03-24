import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { hashBackupCode } from "@/lib/auth/backup-codes";

// 3 regenerations per 24 hours per user (fixed window)
function getBackupCodesRateLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Degrade gracefully — always allow when Redis is not configured
    return {
      limit: async (_identifier: string) => ({
        success: true,
        limit: 3,
        remaining: 2,
        reset: Date.now() + 86_400_000,
      }),
    };
  }

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, "24 h"),
    analytics: false,
  });
}

function generateBackupCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 3 regenerations per 24 hours per user (fixed window)
  const ratelimit = getBackupCodesRateLimiter();
  const { success: rateLimitOk } = await ratelimit.limit(
    `mfa:backup-codes:${user.id}`,
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Backup code regeneration limit reached. Try again in 24 hours." },
      { status: 429 },
    );
  }

  // Verify user has an active verified MFA factor
  const { data: factors, error: listError } =
    await supabase.auth.mfa.listFactors();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const hasVerifiedFactor = (factors?.totp ?? []).some(
    (f) => f.status === "verified",
  );

  if (!hasVerifiedFactor) {
    return NextResponse.json(
      { error: "MFA is not enabled. Enable MFA before generating backup codes." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // Delete all existing backup codes for this user
  const { error: deleteError } = await admin
    .from("user_backup_codes")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to clear existing backup codes" },
      { status: 500 },
    );
  }

  // Generate 8 new plaintext backup codes
  const plainCodes = Array.from({ length: 8 }, generateBackupCode);
  const hashedCodes = plainCodes.map(hashBackupCode);

  const rows = hashedCodes.map((hashed) => ({
    user_id: user.id,
    code_hash: hashed,
    used: false,
  }));

  const { error: insertError } = await admin
    .from("user_backup_codes")
    .insert(rows);

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to store backup codes" },
      { status: 500 },
    );
  }

  // Return plaintext codes — shown once, never accessible again
  return NextResponse.json({ backup_codes: plainCodes });
}

