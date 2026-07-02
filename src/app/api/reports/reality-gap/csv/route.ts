import { NextResponse, type NextRequest } from "next/server";

import { createRateLimiter } from "@/lib/cache/redis";
import {
  buildRealityGapCsv,
  getRealityGapEdition,
  isValidPeriod,
} from "@/services/reports/reality-gap-service";

// 20 req/min/IP. Fails open if Redis is unavailable (same trade-off as
// /api/area-prices/postcode-detail — availability trumps the rate limit).
const csvLimiter = createRateLimiter(20, "1 m");

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * GET /api/reports/reality-gap/csv?edition=2026-Q2
 *
 * Public CSV of one Reality Gap edition (default: latest). The data is
 * public-read; only PUBLISHED cells are serialised — suppressed cells never
 * appear (buildRealityGapCsv filters them as defence in depth).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = await csvLimiter.limit(`reality-gap-csv:${clientIp(request)}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const editionParam = request.nextUrl.searchParams.get("edition") ?? undefined;
  if (editionParam !== undefined && !isValidPeriod(editionParam)) {
    return NextResponse.json({ error: "invalid_edition" }, { status: 400 });
  }

  const { period, rows } = await getRealityGapEdition(editionParam);
  if (!period || rows.length === 0) {
    return NextResponse.json({ error: "edition_not_found" }, { status: 404 });
  }

  const csv = buildRealityGapCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="truedeed-reality-gap-${period}.csv"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
