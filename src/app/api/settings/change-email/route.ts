/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReauthToken } from "@/lib/auth/reauth-token";
import { sendSecurityAlert } from "@/services/email/security-email-service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("reauth_token" in body) ||
      !("email" in body)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { reauth_token, email } = body as {
      reauth_token: unknown;
      email: unknown;
    };

    if (typeof reauth_token !== "string" || !reauth_token) {
      return NextResponse.json(
        { error: "Invalid reauth token" },
        { status: 403 },
      );
    }

    if (!verifyReauthToken(reauth_token, user.id)) {
      return NextResponse.json(
        { error: "Re-authentication required" },
        { status: 403 },
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Use the authenticated USER client (not admin) because Supabase's
    // updateUser({ email }) triggers the built-in email confirmation flow
    // (sends a verification link to the new address). The admin client's
    // updateUserById would change the email immediately without verification.
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      console.error("[change-email]", error.message);
    }

    // Send security notification to the OLD email (fire-and-forget)
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      void sendSecurityAlert({
        userId: user.id,
        email: user.email!,
        firstName: profile?.display_name?.split(" ")[0] ?? "",
        eventType: "email_change_requested",
      });
    } catch {
      // Non-critical — never block the response
    }

    // Always return the same success message regardless of whether the email
    // is taken or not to prevent email enumeration (BUG-30).
    return NextResponse.json({
      message: "If this email is available, a verification link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
