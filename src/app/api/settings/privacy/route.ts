import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PRIVACY_KEYS = [
  "visibility",
  "search_indexing",
  "anonymous_analytics",
  "third_party_marketing",
  "active_status",
  "last_viewed_visible",
] as const;

type AllowedPrivacyKey = (typeof ALLOWED_PRIVACY_KEYS)[number];
type VisibilityValue = "public" | "registered_only" | "private";

const VALID_VISIBILITY_VALUES: VisibilityValue[] = [
  "public",
  "registered_only",
  "private",
];

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
    .select("privacy_settings")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch privacy settings" }, { status: 500 });
  }

  return NextResponse.json(data?.privacy_settings ?? {});
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

  // Validate visibility if provided
  if ("visibility" in body) {
    const visibility = body.visibility;
    if (!VALID_VISIBILITY_VALUES.includes(visibility as VisibilityValue)) {
      return NextResponse.json(
        {
          error: `visibility must be one of: ${VALID_VISIBILITY_VALUES.join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  // Only extract whitelisted keys from body
  const updates: Partial<Record<AllowedPrivacyKey, unknown>> = {};
  for (const key of ALLOWED_PRIVACY_KEYS) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  // Fetch existing privacy_settings to merge
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("privacy_settings")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch current settings" }, { status: 500 });
  }

  const existingSettings = (profile?.privacy_settings as Record<string, unknown>) ?? {};
  const oldVisibility = existingSettings.visibility as string | undefined;
  const newVisibility = updates.visibility as string | undefined;

  // Merge — don't replace wholesale
  const mergedSettings = { ...existingSettings, ...updates };

  // Compliance log for visibility changes
  if (newVisibility !== undefined && newVisibility !== oldVisibility) {
    console.log({
      user_id: user.id,
      old_visibility: oldVisibility,
      new_visibility: newVisibility,
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ privacy_settings: mergedSettings })
    .eq("id", user.id)
    .select("privacy_settings")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 });
  }

  return NextResponse.json(data?.privacy_settings ?? {});
}
