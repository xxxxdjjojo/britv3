import type { NextRequest } from "next/server";

import { brandConfig } from "@/config/brand";
import {
  datedDeadlines,
  RRA_DEADLINES_CHECKED_DATE,
} from "@/content/rra-deadlines";
import { verifyNewsletterToken } from "@/lib/newsletter-token";
import { buildDeadlineCalendar } from "../../ics";

/**
 * Landlord Deadline Diary .ics feed (Influence Strategy 3.2).
 *
 * The token is the HMAC "calendar" token minted for a landlord_diary
 * subscriber. The feed itself contains only public statutory dates — the
 * token gates the URL so feeds are per-subscriber and revocable by rotating
 * the secret, not because the payload is private. Invalid/expired/mismatched
 * tokens ⇒ 404 (no oracle about why).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;

  const verified = verifyNewsletterToken(decodeURIComponent(token), "calendar");
  if (!verified.ok || verified.audience !== "landlord_diary") {
    return new Response("Not found", { status: 404 });
  }

  const body = buildDeadlineCalendar({
    entries: datedDeadlines(),
    checkedDate: RRA_DEADLINES_CHECKED_DATE,
    uidDomain: brandConfig.canonicalDomain,
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="truedeed-rra-deadlines.ics"',
      "Cache-Control": "private, max-age=3600",
    },
  });
}
