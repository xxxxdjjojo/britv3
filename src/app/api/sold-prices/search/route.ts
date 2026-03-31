import { NextResponse } from "next/server";
import { searchSoldPrices } from "@/services/areas/sold-prices-service";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";

// ---------------------------------------------------------------------------
// Rate limiter: 30 requests per minute per IP (search is high-frequency)
// ---------------------------------------------------------------------------

const searchRateLimiter = createInMemoryRateLimiter(30, 60_000);

// ---------------------------------------------------------------------------
// GET /api/sold-prices/search?q=...
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  // 1. Rate limit
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { success: rateLimitOk } = await searchRateLimiter.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 2. Parse and validate query param
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") ?? "";

  // Sanitize: trim, collapse whitespace, cap at 100 chars
  const query = rawQuery.replace(/\s+/g, " ").trim().slice(0, 100);

  if (query.length < 3) {
    return NextResponse.json(
      { error: "Query must be at least 3 characters" },
      { status: 400 },
    );
  }

  // 3. Search
  const { records } = await searchSoldPrices(query, { limit: 15 });

  // 4. Return lightweight results (only fields needed by the search dropdown)
  const results = records.map((r) => ({
    slug: r.slug,
    address: r.address,
    postcode: r.postcode,
    priceFormatted: r.priceFormatted,
    dateFormatted: r.dateFormatted,
    areaSlug: r.areaSlug,
  }));

  return NextResponse.json(results);
}
