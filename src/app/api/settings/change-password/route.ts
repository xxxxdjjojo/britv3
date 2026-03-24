import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReauthToken } from "@/lib/auth/reauth-token";

export async function POST(request: NextRequest) {
  // 1. Authenticate the caller
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { reauth_token, new_password } = body as {
    reauth_token?: unknown;
    new_password?: unknown;
  };

  // 3. Verify the reauth token
  if (
    !reauth_token ||
    typeof reauth_token !== "string" ||
    !verifyReauthToken(reauth_token, user.id)
  ) {
    return NextResponse.json(
      { error: "Re-authentication required. Please confirm your identity." },
      { status: 403 },
    );
  }

  // 4. Validate new_password
  if (!new_password || typeof new_password !== "string") {
    return NextResponse.json(
      { error: "new_password is required" },
      { status: 400 },
    );
  }

  if (new_password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters" },
      { status: 400 },
    );
  }

  // 5. Change password via admin client
  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(
    user.id,
    { password: new_password },
  );

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update password" },
      { status: 500 },
    );
  }

  // 6. Invalidate other sessions (best-effort)
  try {
    await supabase.auth.signOut({ scope: "others" });
  } catch {
    // Non-critical — log but don't fail the request
    console.warn("Failed to invalidate other sessions after password change");
  }

  // 7. Audit log (best-effort)
  try {
    await admin.from("auth_audit_log").insert({
      user_id: user.id,
      event_type: "password_changed",
      ip_address: null,
    });
  } catch {
    console.warn("Failed to write audit log for password change");
  }

  // 8. Success
  return NextResponse.json({ success: true });
}
