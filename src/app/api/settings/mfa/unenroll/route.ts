import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const factorId =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).factor_id === "string"
      ? ((body as Record<string, unknown>).factor_id as string)
      : null;

  if (!factorId || !factorId.trim()) {
    return NextResponse.json(
      { error: "factor_id is required" },
      { status: 400 },
    );
  }

  // Unenroll the TOTP factor
  const { error: unenrollError } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (unenrollError) {
    return NextResponse.json({ error: unenrollError.message }, { status: 400 });
  }

  // Delete all backup codes for this user using admin client (no DELETE RLS policy)
  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from("user_backup_codes")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    // Log but do not fail the request — MFA is already unenrolled
    console.error(
      `[mfa:unenroll] Failed to delete backup codes for user ${user.id}:`,
      deleteError.message,
    );
  }

  console.log(
    JSON.stringify({ user_id: user.id, event: "unenrolled" }),
  );

  return NextResponse.json({ success: true });
}
