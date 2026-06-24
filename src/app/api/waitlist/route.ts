import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { joinWaitlist } from "@/services/waitlist/waitlist-service";
import { sendWaitlistWelcome } from "@/services/waitlist/waitlist-email";

// 10 req/min/IP. Fails open if Redis is unavailable (signup availability trumps
// the rate-limit on a transient outage).
const waitlistLimiter = createRateLimiter(10, "1 m");

const JoinSchema = z.object({
  email: z.string().email(),
  ref: z.string().min(1).max(32).optional(),
  variant: z.enum(["A", "B", "C"]).optional(),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await waitlistLimiter.limit(`waitlist:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, ref, variant } = parsed.data;

  try {
    const result = await joinWaitlist({
      email,
      referredBy: ref ?? null,
      variant: variant ?? null,
    });

    if (!result.alreadyJoined) {
      await sendWaitlistWelcome({
        email,
        code: result.code,
        position: result.position,
      });
    }

    return NextResponse.json({
      code: result.code,
      position: result.position,
      total: result.total,
      alreadyJoined: result.alreadyJoined,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
