import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_NOTIFICATION_KEYS = [
  "email_messages",
  "email_listings",
  "email_viewings",
  "email_marketing",
  "push_messages",
  "push_listings",
  "sms_alerts",
] as const;

type AllowedNotificationKey = (typeof ALLOWED_NOTIFICATION_KEYS)[number];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(data?.notification_preferences ?? {});
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  // Fetch existing preferences to merge
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

  const existingPreferences =
    (profile?.notification_preferences as Record<string, unknown>) ?? {};

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

  return NextResponse.json(data?.notification_preferences ?? {});
}
