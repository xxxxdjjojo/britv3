/**
 * POST /api/placements/events
 *
 * Records a placement analytics event (impression/click/profile_view/enquiry).
 * Written server-side with the service role so counters can't be forged by
 * clients writing to the table directly. Impressions are only sent by the
 * client when a card is actually rendered and visible (useImpressionTracking).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { createClient } from "@/lib/supabase/server";
import { recordPlacementEvent } from "@/services/placements/placement-events-service";

// One browsing session fires several impression/click beacons; cap per IP.
const eventRateLimiter = createRateLimiter(120, "1 m");

// Zod's .uuid() rejects some valid Postgres hex ids — use the permissive form.
const pgUuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const bodySchema = z.object({
  placementId: pgUuid,
  eventType: z.enum(["impression", "click", "profile_view", "enquiry_started", "enquiry_submitted"]),
  zone: z
    .enum(["property_sidebar", "property_financial", "property_bottom", "search_grid", "area_page", "home"])
    .nullish(),
  propertyId: pgUuid.nullish(),
  sessionId: z.string().max(128).nullish(),
  // Bounded to prevent unbounded JSONB writes from an unauthenticated endpoint.
  metadata: z.record(z.string().max(64), z.union([z.string().max(512), z.number(), z.boolean()])).optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const { success: rateLimitOk } = await eventRateLimiter.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  // Attribute to the viewer when signed in (best-effort; never required).
  let viewerId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerId = user?.id ?? null;
  } catch {
    viewerId = null;
  }

  try {
    await recordPlacementEvent({
      placementId: parsed.placementId,
      eventType: parsed.eventType,
      zone: parsed.zone ?? null,
      propertyId: parsed.propertyId ?? null,
      viewerId,
      sessionId: parsed.sessionId ?? null,
      metadata: parsed.metadata,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
