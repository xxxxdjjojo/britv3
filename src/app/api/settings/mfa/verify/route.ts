import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthRateLimiter } from "@/lib/cache/redis";

// 5 attempts per minute per user for TOTP verification — fail-closed
const verifyRateLimiter = createAuthRateLimiter(5, "1 m");

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

  // Rate limit: 5 attempts per minute per user
  const { success: rateLimitOk } = await verifyRateLimiter.limit(
    `mfa:verify:${user.id}`,
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait before trying again." },
      { status: 429 },
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).factor_id !== "string" ||
    typeof (body as Record<string, unknown>).code !== "string"
  ) {
    return NextResponse.json(
      { error: "factor_id and code are required strings" },
      { status: 400 },
    );
  }

  const { factor_id, code } = body as { factor_id: string; code: string };

  if (!factor_id.trim() || !code.trim()) {
    return NextResponse.json(
      { error: "factor_id and code must not be empty" },
      { status: 400 },
    );
  }

  // Challenge and verify the TOTP code
  const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor_id,
    code,
  });

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 400 });
  }

  // Generate 8 plaintext backup codes (shown once, never stored in plaintext)
  const plainCodes = Array.from({ length: 8 }, generateBackupCode);
  const hashedCodes = plainCodes.map(hashBackupCode);

  // Use admin client — user_backup_codes has no INSERT/DELETE RLS policies
  const admin = createAdminClient();

  // Remove any previously stored backup codes for this user
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

  // Insert the new hashed backup codes
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
  return NextResponse.json({ success: true, backup_codes: plainCodes });
}
