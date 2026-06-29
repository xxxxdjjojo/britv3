import { NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/cache/redis";
import { logDevelopmentEvent } from "@/services/new-homes/events-service";

// Client-side analytics beacons (development_viewed, unit_viewed). Higher limit
// than leads since one browsing session fires several.
const eventRateLimiter = createRateLimiter(60, "1 m");

// Postgres-permissive UUID (Zod's .uuid() rejects valid hex ids — see lead-schema).
const pgUuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const eventSchema = z.object({
  eventType: z.enum([
    "development_viewed",
    "unit_viewed",
    "brochure_requested",
    "enquiry_submitted",
    "viewing_requested",
    "viewing_booked",
    "reservation_requested",
    "reservation_confirmed",
  ]),
  developmentId: pgUuid.optional().nullable(),
  unitId: pgUuid.optional().nullable(),
  sessionId: z.string().max(120).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success: rateLimitOk } = await eventRateLimiter.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  await logDevelopmentEvent({
    eventType: parsed.data.eventType,
    developmentId: parsed.data.developmentId ?? null,
    unitId: parsed.data.unitId ?? null,
    sessionId: parsed.data.sessionId ?? null,
    metadata: parsed.data.metadata ?? {},
  });

  return NextResponse.json({ success: true });
}
