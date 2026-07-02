import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { appUrl } from "@/config/brand";
import { createRateLimiter } from "@/lib/cache/redis";
import { generateNewsletterToken } from "@/lib/newsletter-token";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";
import {
  sendBriefingConfirm,
  sendNewsletterWelcome,
} from "@/services/email/email-service";

// 10 req/min/IP. Fails open if Redis is unavailable (subscribe availability
// trumps the rate-limit on a transient outage).
const newsletterLimiter = createRateLimiter(10, "1 m");

// Confirmation emails additionally limited PER EMAIL ADDRESS: an attacker
// rotating IPs must not be able to flood a pending subscriber's inbox with
// confirmation mail (subscribe-bomb).
const confirmEmailLimiter = createRateLimiter(1, "15 m");

const SubscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).max(64).optional(),
  audience: z
    .enum(["consumer", "agent_briefing", "landlord_diary", "ftb_bootcamp"])
    .default("consumer"),
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

  const { email, source, audience } = parsed.data;

  const result = await subscribeToNewsletter({
    email,
    source: source ?? "blog",
    audience,
  });

  if (!result.ok) {
    const status = result.error === "invalid_email" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Emails are best-effort — the email service swallows its own failures, so
  // a send problem never blocks a successful subscription response.
  if (result.requiresConfirmation) {
    // Double-opt-in audiences get a confirmation link instead of a welcome.
    // Re-subscribing while still pending re-sends the confirmation, but at
    // most once per 15 minutes per email address (anti subscribe-bomb).
    const normalisedEmail = email.trim().toLowerCase();
    const emailRl = await confirmEmailLimiter.limit(
      `newsletter-confirm:${audience}:${normalisedEmail}`,
    );
    if (emailRl.success) {
      const token = generateNewsletterToken(normalisedEmail, audience, "confirm");
      await sendBriefingConfirm({
        to: email,
        confirmUrl: appUrl(`/api/newsletter/confirm?token=${encodeURIComponent(token)}`),
      });
    }
    // Response is identical whether or not a mail was sent — no oracle.
    return NextResponse.json({ ok: true, requiresConfirmation: true });
  }

  if (!result.alreadySubscribed) {
    await sendNewsletterWelcome({ to: email });
  }

  return NextResponse.json({
    ok: true,
    alreadySubscribed: result.alreadySubscribed,
  });
}
