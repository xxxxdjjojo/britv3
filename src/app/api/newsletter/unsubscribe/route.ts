import { NextResponse, type NextRequest } from "next/server";

import { verifyNewsletterToken } from "@/lib/newsletter-token";
import {
  unsubscribeFromNewsletter,
  type NewsletterAudience,
} from "@/services/newsletter/newsletter-service";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

/**
 * Per-audience newsletter unsubscribe link target (used in briefing emails —
 * distinct from the /unsubscribe page, which is for user notification prefs).
 * Verifies the HMAC unsubscribe token and flips the (email, audience) row to
 * unsubscribed. Idempotent.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirectTo(request, "/?unsubscribe_error=invalid");
  }

  const verified = verifyNewsletterToken(token, "unsubscribe");
  if (!verified.ok) {
    return redirectTo(request, "/?unsubscribe_error=invalid");
  }

  const result = await unsubscribeFromNewsletter(
    verified.email,
    verified.audience as NewsletterAudience,
  );
  if (!result.ok) {
    return redirectTo(request, "/?unsubscribe_error=invalid");
  }

  return redirectTo(request, "/?unsubscribed=1");
}
