import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter } from "@/lib/cache/redis";

// 3 regenerations per 24 hours per user
const backupCodesRateLimiter = createRateLimiter(3, "24 h");

function generateBackupCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

function hashBackupCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 3 regenerations per 24 hours per user
  const { success: rateLimitOk } = await backupCodesRateLimiter.limit(
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

