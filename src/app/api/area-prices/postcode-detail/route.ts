import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRateLimiter } from "@/lib/cache/redis";
import {
  getRecentSalesForPostcode,
  getSectorTrend,
} from "@/services/truedeed/ppd-postcode-service";

// 20 req/min/IP. Fails open if Redis is unavailable (same trade-off as
// /api/newsletter — availability trumps the rate-limit on a transient outage).
const postcodeDetailLimiter = createRateLimiter(20, "1 m");

// Full UK postcode (outward + inward), space optional — e.g. "M1 1AE" / "m11ae".
const UK_POSTCODE_PATTERN = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/;

const QuerySchema = z.object({
  postcode: z.string().trim().regex(UK_POSTCODE_PATTERN, "invalid_postcode"),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * GET /api/area-prices/postcode-detail?postcode=M1+1AE
 *
 * Real HM Land Registry PPD rows only: the most recent sales for the postcode
 * plus a self-gated 12-month sector trend (insufficient below 30 sales).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await postcodeDetailLimiter.limit(`postcode-detail:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = QuerySchema.safeParse({
    postcode: request.nextUrl.searchParams.get("postcode") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_postcode" }, { status: 400 });
  }

  const { postcode } = parsed.data;
  const [recentSales, trend] = await Promise.all([
    getRecentSalesForPostcode(postcode),
    getSectorTrend(postcode),
  ]);

  return NextResponse.json({ recentSales, trend });
}
