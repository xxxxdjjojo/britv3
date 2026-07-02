import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRfq, createGuestRfq } from "@/services/marketplace/rfq-service";
import { rfqGuestCreateSchema } from "@/lib/validators/marketplace-schemas";
import { redis, createRateLimiter } from "@/lib/cache/redis";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";

// Guests: 5 quote requests per hour per IP. Authed users are covered by RLS.
// Upstash sliding window (shared across instances, survives restarts); the
// per-instance in-memory limiter is only the fallback when Redis env is
// unconfigured — createRateLimiter alone would degrade to a NO-OP there.
const GUEST_MAX_REQUESTS = 5;
const GUEST_WINDOW_MS = 60 * 60 * 1000;
const guestRateLimiter = redis
  ? createRateLimiter(GUEST_MAX_REQUESTS, "1 h")
  : createInMemoryRateLimiter(GUEST_MAX_REQUESTS, GUEST_WINDOW_MS);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();

    if (user) {
      const rfq = await createRfq(supabase, user.id, body);
      return NextResponse.json({ data: rfq }, { status: 201 });
    }

    // ---- Guest path (service-role; no anon RLS insert exists) ----
    // Honeypot: real users never see/fill the `company` field. Pretend success.
    if (typeof body.company === "string" && body.company.trim() !== "") {
      return NextResponse.json({ data: { id: null } }, { status: 201 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { success } = await guestRateLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const parsed = rfqGuestCreateSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid quote request";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const admin = createAdminClient();
    const rfq = await createGuestRfq(admin, parsed.data);
    return NextResponse.json({ data: rfq }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create RFQ";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
