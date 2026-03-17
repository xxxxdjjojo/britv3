import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";

const ALLOWED_LOCALES = ["en-GB", "en-US", "cy", "gd", "ga"] as const;
const ALLOWED_DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
const ALLOWED_CURRENCIES = ["GBP", "EUR", "USD"] as const;
const ALLOWED_TIMEZONES = ["Europe/London", "Europe/Dublin", "Europe/Edinburgh"] as const;
const ALLOWED_FONT_SIZES = ["small", "medium", "large", "x-large"] as const;
const ALLOWED_DARK_MODES = ["system", "light", "dark"] as const;

type LanguagePrefs = {
  locale: (typeof ALLOWED_LOCALES)[number];
  date_format: (typeof ALLOWED_DATE_FORMATS)[number];
  currency: (typeof ALLOWED_CURRENCIES)[number];
  timezone: (typeof ALLOWED_TIMEZONES)[number];
};

type AccessibilityPrefs = {
  font_size: (typeof ALLOWED_FONT_SIZES)[number];
  reduced_motion: boolean;
  high_contrast: boolean;
  dark_mode: (typeof ALLOWED_DARK_MODES)[number];
  screen_reader_hints: boolean;
};

function includes<T>(arr: readonly T[], val: unknown): val is T {
  return (arr as readonly unknown[]).includes(val);
}

function validateLanguageFields(
  input: Record<string, unknown>,
): { valid: Partial<LanguagePrefs>; error?: string } {
  const valid: Partial<LanguagePrefs> = {};

  if ("locale" in input) {
    if (!includes(ALLOWED_LOCALES, input.locale)) {
      return { valid: {}, error: `locale must be one of: ${ALLOWED_LOCALES.join(", ")}` };
    }
    valid.locale = input.locale;
  }
  if ("date_format" in input) {
    if (!includes(ALLOWED_DATE_FORMATS, input.date_format)) {
      return { valid: {}, error: `date_format must be one of: ${ALLOWED_DATE_FORMATS.join(", ")}` };
    }
    valid.date_format = input.date_format;
  }
  if ("currency" in input) {
    if (!includes(ALLOWED_CURRENCIES, input.currency)) {
      return { valid: {}, error: `currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}` };
    }
    valid.currency = input.currency;
  }
  if ("timezone" in input) {
    if (!includes(ALLOWED_TIMEZONES, input.timezone)) {
      return { valid: {}, error: `timezone must be one of: ${ALLOWED_TIMEZONES.join(", ")}` };
    }
    valid.timezone = input.timezone;
  }

  return { valid };
}

function validateAccessibilityFields(
  input: Record<string, unknown>,
): { valid: Partial<AccessibilityPrefs>; error?: string } {
  const valid: Partial<AccessibilityPrefs> = {};

  if ("font_size" in input) {
    if (!includes(ALLOWED_FONT_SIZES, input.font_size)) {
      return { valid: {}, error: `font_size must be one of: ${ALLOWED_FONT_SIZES.join(", ")}` };
    }
    valid.font_size = input.font_size;
  }
  if ("dark_mode" in input) {
    if (!includes(ALLOWED_DARK_MODES, input.dark_mode)) {
      return { valid: {}, error: `dark_mode must be one of: ${ALLOWED_DARK_MODES.join(", ")}` };
    }
    valid.dark_mode = input.dark_mode;
  }
  if ("reduced_motion" in input) {
    if (typeof input.reduced_motion !== "boolean") {
      return { valid: {}, error: "reduced_motion must be a boolean" };
    }
    valid.reduced_motion = input.reduced_motion;
  }
  if ("high_contrast" in input) {
    if (typeof input.high_contrast !== "boolean") {
      return { valid: {}, error: "high_contrast must be a boolean" };
    }
    valid.high_contrast = input.high_contrast;
  }
  if ("screen_reader_hints" in input) {
    if (typeof input.screen_reader_hints !== "boolean") {
      return { valid: {}, error: "screen_reader_hints must be a boolean" };
    }
    valid.screen_reader_hints = input.screen_reader_hints;
  }

  return { valid };
}

export async function GET() {
  const { supabase, user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error } = await supabase!
    .from("profiles")
    .select("language_preferences, accessibility_preferences")
    .eq("id", user!.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    language: data?.language_preferences ?? {},
    accessibility: data?.accessibility_preferences ?? {},
  });
}

export async function PUT(request: NextRequest) {
  const { supabase, user, error: authError } = await requireAuth();
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const languageInput = (body.language as Record<string, unknown> | undefined) ?? {};
  const accessibilityInput = (body.accessibility as Record<string, unknown> | undefined) ?? {};

  // Validate language fields
  if (typeof languageInput === "object" && Object.keys(languageInput).length > 0) {
    const { valid: langValid, error: langError } = validateLanguageFields(languageInput);
    if (langError) {
      return NextResponse.json({ error: langError }, { status: 400 });
    }
    if (Object.keys(langValid).length === 0 && Object.keys(languageInput).length > 0) {
      return NextResponse.json({ error: "No valid language fields provided" }, { status: 400 });
    }
  }

  // Validate accessibility fields
  if (typeof accessibilityInput === "object" && Object.keys(accessibilityInput).length > 0) {
    const { valid: a11yValid, error: a11yError } = validateAccessibilityFields(accessibilityInput);
    if (a11yError) {
      return NextResponse.json({ error: a11yError }, { status: 400 });
    }
    if (Object.keys(a11yValid).length === 0 && Object.keys(accessibilityInput).length > 0) {
      return NextResponse.json({ error: "No valid accessibility fields provided" }, { status: 400 });
    }
  }

  const hasLanguage = Object.keys(languageInput).length > 0;
  const hasAccessibility = Object.keys(accessibilityInput).length > 0;

  if (!hasLanguage && !hasAccessibility) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  // Fetch existing preferences to merge
  const { data: profile, error: fetchError } = await supabase!
    .from("profiles")
    .select("language_preferences, accessibility_preferences")
    .eq("id", user!.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch current preferences" },
      { status: 500 },
    );
  }

  const updatePayload: Record<string, unknown> = {};

  if (hasLanguage) {
    const existing = (profile?.language_preferences as Record<string, unknown>) ?? {};
    const { valid } = validateLanguageFields(languageInput);
    updatePayload.language_preferences = { ...existing, ...valid };
  }

  if (hasAccessibility) {
    const existing = (profile?.accessibility_preferences as Record<string, unknown>) ?? {};
    const { valid } = validateAccessibilityFields(accessibilityInput);
    updatePayload.accessibility_preferences = { ...existing, ...valid };
  }

  const { data, error } = await supabase!
    .from("profiles")
    .update(updatePayload)
    .eq("id", user!.id)
    .select("language_preferences, accessibility_preferences")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    language: data?.language_preferences ?? {},
    accessibility: data?.accessibility_preferences ?? {},
  });
}
