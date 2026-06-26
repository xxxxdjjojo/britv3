import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";
import { sendNewsletterWelcome } from "@/services/email/email-service";

// 10 req/min/IP. Fails open if Redis is unavailable (subscribe availability
// trumps the rate-limit on a transient outage).
const newsletterLimiter = createRateLimiter(10, "1 m");

const SubscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).max(64).optional(),
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
  const rl = await newsletterLimiter.limit(`newsletter:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, source } = parsed.data;

  const result = await subscribeToNewsletter({
    email,
    source: source ?? "blog",
  });

  if (!result.ok) {
    const status = result.error === "invalid_email" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (!result.alreadySubscribed) {
    // Email is best-effort — the service swallows its own failures, so a send
    // problem never blocks a successful subscription response.
    await sendNewsletterWelcome({ to: email });
  }

  return NextResponse.json({
    ok: true,
    alreadySubscribed: result.alreadySubscribed,
  });
}
