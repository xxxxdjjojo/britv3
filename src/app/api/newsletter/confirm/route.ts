import { NextResponse, type NextRequest } from "next/server";

import { appUrl } from "@/config/brand";
import {
  generateNewsletterToken,
  verifyNewsletterToken,
} from "@/lib/newsletter-token";
import {
  confirmNewsletterSubscription,
  DOUBLE_OPT_IN_AUDIENCES,
  type NewsletterAudience,
} from "@/services/newsletter/newsletter-service";
import { sendBriefingWelcome } from "@/services/email/email-service";

const ERROR_REDIRECT = "/agent-briefing?subscribe_error=expired";

const SUCCESS_REDIRECT: Partial<Record<NewsletterAudience, string>> = {
  agent_briefing: "/agent-briefing?subscribed=1",
  landlord_diary: "/landlords/deadline-diary?subscribed=1",
};

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

/**
 * Double-opt-in confirmation link target. Verifies the HMAC confirm token,
 * flips the (email, audience) row to subscribed, sends the audience welcome
 * email, and redirects to the audience landing page.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirectTo(request, ERROR_REDIRECT);
  }

  const verified = verifyNewsletterToken(token, "confirm");
  if (!verified.ok) {
    return redirectTo(request, ERROR_REDIRECT);
  }

  const { email } = verified;
  const audience = verified.audience as NewsletterAudience;

  const result = await confirmNewsletterSubscription(email, audience);
  if (!result.ok) {
    return redirectTo(request, ERROR_REDIRECT);
  }

  // Welcome the subscriber on first confirmation only — re-clicking the
  // confirm link must not re-send the welcome. Best-effort: the email service
  // swallows its own failures.
  const isBriefingAudience = (DOUBLE_OPT_IN_AUDIENCES as readonly string[]).includes(
    audience,
  );
  if (!result.alreadyConfirmed && isBriefingAudience) {
    const unsubscribeToken = generateNewsletterToken(email, audience, "unsubscribe");
    await sendBriefingWelcome({
      to: email,
      unsubscribeUrl: appUrl(
        `/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
      ),
    });
  }

  return redirectTo(request, SUCCESS_REDIRECT[audience] ?? "/?subscribed=1");
}
