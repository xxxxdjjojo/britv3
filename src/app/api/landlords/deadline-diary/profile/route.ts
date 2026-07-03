import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { appUrl } from "@/config/brand";
import { createRateLimiter } from "@/lib/cache/redis";
import { generateNewsletterToken } from "@/lib/newsletter-token";
import { createAdminClient } from "@/lib/supabase/admin";

// Same posture as /api/newsletter: 10 req/min/IP, fails open if Redis is
// unavailable (capture availability trumps the rate-limit on an outage).
const profileLimiter = createRateLimiter(10, "1 m");

const UNIQUE_VIOLATION = "23505";

const ProfileSchema = z.object({
  email: z.string().email(),
  tenancyPreMay: z.boolean().optional(),
  region: z
    .enum(["england", "wales", "scotland", "northern_ireland"])
    .optional(),
  hasAgent: z.boolean().optional(),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Landlord Deadline Diary profile capture (Influence Strategy 3.2).
 *
 * Stores the 2–3 personalisation answers alongside the landlord_diary
 * newsletter subscription (the subscription itself goes through the existing
 * /api/newsletter endpoint — this route only owns the profile row). Upserts
 * by lower-cased email so re-submitting refines the answers.
 *
 * Returns the per-subscriber .ics calendar URL so the page can offer
 * "add to calendar" immediately. The feed contains only public statutory
 * dates, so minting the URL here leaks nothing personal.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await profileLimiter.limit(`diary-profile:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const row = {
    email,
    tenancy_pre_may: parsed.data.tenancyPreMay ?? null,
    region: parsed.data.region ?? null,
    has_agent: parsed.data.hasAgent ?? null,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();

    // Find-then-write instead of upsert: the uniqueness is a lower(email)
    // expression index, which PostgREST's on_conflict cannot target (same
    // pattern as newsletter-service).
    const { data: existing, error: lookupError } = await supabase
      .from("landlord_diary_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) throw new Error("diary-profile: lookup failed");

    if (existing) {
      const { error } = await supabase
        .from("landlord_diary_profiles")
        .update(row)
        .eq("id", existing.id);
      if (error) throw new Error("diary-profile: update failed");
    } else {
      const { error } = await supabase
        .from("landlord_diary_profiles")
        .insert(row);
      if (error && error.code !== UNIQUE_VIOLATION) {
        throw new Error("diary-profile: insert failed");
      }
      if (error && error.code === UNIQUE_VIOLATION) {
        // Concurrent insert of the same email — apply as an update instead.
        const { error: retryError } = await supabase
          .from("landlord_diary_profiles")
          .update(row)
          .eq("email", email);
        if (retryError) throw new Error("diary-profile: retry update failed");
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[deadline-diary] profile capture failed", message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const calendarToken = generateNewsletterToken(email, "landlord_diary", "calendar");
  return NextResponse.json({
    ok: true,
    calendarUrl: appUrl(
      `/api/landlords/deadline-diary/${encodeURIComponent(calendarToken)}/calendar.ics`,
    ),
  });
}
