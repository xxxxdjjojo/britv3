import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Whitelists — reject any value not in these sets
// ---------------------------------------------------------------------------

const ALLOWED_LOCALES = ["en-GB", "en-US", "cy-GB", "gd-GB"] as const;
const ALLOWED_DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
const ALLOWED_CURRENCIES = ["GBP", "EUR", "USD"] as const;
const ALLOWED_TIMEZONES = ["Europe/London", "Europe/Dublin", "Europe/Edinburgh"] as const;
const ALLOWED_FONT_SIZES = ["small", "medium", "large"] as const;
const ALLOWED_DARK_MODES = ["system", "light", "dark"] as const;

type LanguagePreferences = {
  locale: (typeof ALLOWED_LOCALES)[number];
  date_format: (typeof ALLOWED_DATE_FORMATS)[number];
  currency: (typeof ALLOWED_CURRENCIES)[number];
  timezone: (typeof ALLOWED_TIMEZONES)[number];
};

type AccessibilityPreferences = {
  font_size: (typeof ALLOWED_FONT_SIZES)[number];
  reduced_motion: boolean;
  high_contrast: boolean;
  dark_mode: (typeof ALLOWED_DARK_MODES)[number];
  screen_reader_hints: boolean;
};

const LANGUAGE_DEFAULTS: LanguagePreferences = {
  locale: "en-GB",
  date_format: "DD/MM/YYYY",
  currency: "GBP",
  timezone: "Europe/London",
};

const ACCESSIBILITY_DEFAULTS: AccessibilityPreferences = {
  font_size: "medium",
  reduced_motion: false,
  high_contrast: false,
  dark_mode: "system",
  screen_reader_hints: false,
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

type ValidationRule =
  | { type: "enum"; list: readonly string[] }
  | { type: "boolean" };

const FIELD_RULES: Record<string, ValidationRule> = {
  locale: { type: "enum", list: ALLOWED_LOCALES },
  date_format: { type: "enum", list: ALLOWED_DATE_FORMATS },
  currency: { type: "enum", list: ALLOWED_CURRENCIES },
  timezone: { type: "enum", list: ALLOWED_TIMEZONES },
  font_size: { type: "enum", list: ALLOWED_FONT_SIZES },
  dark_mode: { type: "enum", list: ALLOWED_DARK_MODES },
  reduced_motion: { type: "boolean" },
  high_contrast: { type: "boolean" },
  screen_reader_hints: { type: "boolean" },
};

const LANGUAGE_FIELDS = new Set(["locale", "date_format", "currency", "timezone"]);

// ---------------------------------------------------------------------------
// GET — fetch combined preferences
// ---------------------------------------------------------------------------

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
    .select("language_preferences, accessibility_preferences")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }

  const language = {
    ...LANGUAGE_DEFAULTS,
    ...(data?.language_preferences as Record<string, unknown> | null),
  };
  const accessibility = {
    ...ACCESSIBILITY_DEFAULTS,
    ...(data?.accessibility_preferences as Record<string, unknown> | null),
  };

  return NextResponse.json({ ...language, ...accessibility });
}

// ---------------------------------------------------------------------------
// PUT — partial update with strict value whitelisting
// ---------------------------------------------------------------------------

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

  // Validate and partition updates into language vs accessibility
  const languageUpdates: Record<string, unknown> = {};
  const accessibilityUpdates: Record<string, unknown> = {};
  let hasUpdates = false;

  for (const [key, value] of Object.entries(body)) {
    const rule = FIELD_RULES[key];
    if (!rule) continue; // silently ignore unknown keys

    if (rule.type === "boolean") {
      if (typeof value !== "boolean") {
        return NextResponse.json(
          { error: `${key} must be a boolean` },
          { status: 400 },
        );
      }
    } else if (rule.type === "enum") {
      if (!isInList(value, rule.list)) {
        return NextResponse.json(
          { error: `Invalid value for ${key}. Allowed: ${rule.list.join(", ")}` },
          { status: 400 },
        );
      }
    }

    if (LANGUAGE_FIELDS.has(key)) {
      languageUpdates[key] = value;
    } else {
      accessibilityUpdates[key] = value;
    }
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return NextResponse.json(
      { error: "No valid fields provided" },
      { status: 400 },
    );
  }

  // Fetch existing to merge
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("language_preferences, accessibility_preferences")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch current preferences" },
      { status: 500 },
    );
  }

  const existingLang = {
    ...LANGUAGE_DEFAULTS,
    ...(profile?.language_preferences as Record<string, unknown> | null),
  };
  const existingA11y = {
    ...ACCESSIBILITY_DEFAULTS,
    ...(profile?.accessibility_preferences as Record<string, unknown> | null),
  };

  const mergedLang = { ...existingLang, ...languageUpdates };
  const mergedA11y = { ...existingA11y, ...accessibilityUpdates };

  // Build the update payload — only include columns that changed
  const updatePayload: Record<string, unknown> = {};
  if (Object.keys(languageUpdates).length > 0) {
    updatePayload.language_preferences = mergedLang;
  }
  if (Object.keys(accessibilityUpdates).length > 0) {
    updatePayload.accessibility_preferences = mergedA11y;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ...mergedLang, ...mergedA11y });
}
