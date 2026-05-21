/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import type {
  NotificationPreferences,
  EventType,
} from "@/types/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notifications";

/**
 * Create a service-role Supabase client that bypasses RLS.
 * Used here because the unsubscribe request is authenticated by HMAC token,
 * not by a user session cookie.
 */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No cookies needed for service role client
        },
      },
    },
  );
}

/**
 * Build an updated preferences object with all email channels disabled.
 */
function buildUnsubscribedPreferences(
  existing: NotificationPreferences | null,
): NotificationPreferences {
  const base = existing ?? DEFAULT_NOTIFICATION_PREFERENCES;

  // Disable email for every event type defined in per_type
  const allEventTypes: EventType[] = [
    "new_message",
    "quote_received",
    "quote_sent",
    "booking_confirmed",
    "booking_updated",
    "milestone_updated",
    "offer_received",
    "viewing_scheduled",
    "review_posted",
  ];

  const updatedPerType: NotificationPreferences["per_type"] = { ...base.per_type };

  for (const eventType of allEventTypes) {
    const current = updatedPerType[eventType] ?? { in_app: true, email: true, push: false, sms: false };
    updatedPerType[eventType] = { ...current, email: false };
  }

  return {
    per_type: updatedPerType,
    quiet_hours: base.quiet_hours,
    digest_frequency: "never",
  };
}

/**
 * POST /api/notifications/unsubscribe?token=...
 *
 * Validates the HMAC token and disables all email notifications for the user.
 * Does not require an authenticated session — the token itself is the credential.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const result = verifyUnsubscribeToken(token);

  if (!result.valid) {
    const message =
      result.reason === "expired" ? "Link expired" : "Invalid token";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();

    // Fetch current preferences from profiles table
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", result.userId)
      .single();

    if (fetchError) {
      console.error("[POST /api/notifications/unsubscribe] fetch error", fetchError);
      return NextResponse.json(
        { error: "Failed to retrieve preferences" },
        { status: 500 },
      );
    }

    const row = data as { preferences: NotificationPreferences | null } | null;
    const updatedPrefs = buildUnsubscribedPreferences(row?.preferences ?? null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        preferences: updatedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", result.userId);

    if (updateError) {
      console.error("[POST /api/notifications/unsubscribe] update error", updateError);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/notifications/unsubscribe]", err);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
