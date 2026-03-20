import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPasswordChanged } from "@/services/email/email-service";

/**
 * POST /api/auth/password-changed
 * Sends a "password changed" notification email to the authenticated user.
 * Fire-and-forget from the client — non-blocking.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const firstName =
    (profile?.display_name as string | undefined)?.split(" ")[0] ?? "";

  void sendPasswordChanged({
    userId: user.id,
    email: user.email,
    firstName,
  });

  return NextResponse.json({ ok: true });
}
