import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { migrateNotificationPrefs } from "@/lib/notifications/migrate-notification-prefs";

const ALLOWED_NOTIFICATION_KEYS = [
  "property_alerts_email",
  "property_alerts_push",
  "property_alerts_sms",
  "property_alerts_inapp",
  "viewings_email",
  "viewings_push",
  "viewings_sms",
  "viewings_inapp",
  "offers_email",
  "offers_push",
  "offers_sms",
  "offers_inapp",
  "messages_email",
  "messages_push",
  "messages_sms",
  "messages_inapp",
  "market_reports_email",
  "market_reports_push",
  "market_reports_sms",
  "market_reports_inapp",
] as const;

type AllowedNotificationKey = (typeof ALLOWED_NOTIFICATION_KEYS)[number];

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 },
    );
  }

  // Migration-on-read: convert old schema to new 20-key schema
  const migrated = migrateNotificationPrefs(
    data?.notification_preferences as Record<string, unknown> | null,
  );

  return NextResponse.json(migrated);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only extract whitelisted boolean keys from body
  const updates: Partial<Record<AllowedNotificationKey, boolean>> = {};
  for (const key of ALLOWED_NOTIFICATION_KEYS) {
    if (key in body) {
      const value = body[key];
      if (typeof value !== "boolean") {
        return NextResponse.json(
          { error: `${key} must be a boolean` },
          { status: 400 },
        );
      }
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided" },
      { status: 400 },
    );
  }

  // Fetch existing preferences, migrate, then merge updates
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch current preferences" },
      { status: 500 },
    );
  }

  const existingPreferences = migrateNotificationPrefs(
    profile?.notification_preferences as Record<string, unknown> | null,
  );

  // Merge — don't replace wholesale
  const mergedPreferences = { ...existingPreferences, ...updates };

  const { data, error } = await supabase
    .from("profiles")
    .update({ notification_preferences: mergedPreferences })
    .eq("id", user.id)
    .select("notification_preferences")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json(data?.notification_preferences ?? mergedPreferences);
}
