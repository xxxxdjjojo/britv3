import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDeletionRequest,
  hasPendingDeletion,
} from "@/services/gdpr/consent-service";
import { sendAccountDeletion } from "@/services/email/email-service";
import { createAuthRateLimiter } from "@/lib/cache/redis";

const gdprDeleteLimiter = createAuthRateLimiter(1, "1 h");

/**
 * POST /api/gdpr/delete
 * Creates a deletion request with 30-day grace period.
 * Prevents duplicate pending requests.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  // Re-auth gate: require password confirmation
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body required" },
      { status: 400 },
    );
  }

  if (!body.password || typeof body.password !== "string") {
    return NextResponse.json(
      { error: "Password confirmation required" },
      { status: 400 },
    );
  }

  // Verify password by attempting sign-in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: body.password,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 403 },
    );
  }

  // Rate limit: 1 deletion request per hour (fail-closed)
  const { success: rateLimitOk } = await gdprDeleteLimiter.limit(user.id);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Please wait before requesting deletion again." },
      { status: 429 },
    );
  }

  try {
    // Check for existing pending request
    const hasPending = await hasPendingDeletion(user.id);
    if (hasPending) {
      return NextResponse.json(
        { error: "A deletion request is already pending" },
        { status: 409 },
      );
    }

    const { data, error } = await createDeletionRequest(user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to create deletion request" },
        { status: 500 },
      );
    }

    // Log the deletion request event
    await supabase.from("auth_audit_log").insert({
      user_id: user.id,
      event_type: "deletion_requested",
      ip_address: null,
    });

    // Fire-and-forget: send account deletion confirmation email
    if (user.email) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        const firstName =
          (profile?.display_name as string | undefined)?.split(" ")[0] ?? "";

        void sendAccountDeletion({
          userId: user.id,
          email: user.email,
          firstName,
          deletedAt: new Date().toISOString(),
          dataRetentionDays: 30,
        });
      } catch (emailError) {
        console.error("POST /api/gdpr/delete sendAccountDeletion error:", emailError);
      }
    }

    return NextResponse.json({
      scheduled_purge_at: data?.scheduled_purge_at,
      message: "Account scheduled for deletion",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process deletion request" },
      { status: 500 },
    );
  }
}
