/**
 * GET /api/market-map/postcode-card
 *
 * Returns the postcode-keyed area card (flat + house price bands, prices in
 * pounds) for one postcode, read straight from the market-map precompute via
 * the market_map_postcode_card RPC. CDN-cached via Cache-Control headers.
 *
 * Query params:
 *   postcode  UK postcode — required, non-empty
 *   window    rolling-window months (default 12)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPostcodeCard } from "@/services/market-map/postcode-card-service";

const querySchema = z.object({
  postcode: z.string().min(1),
  window: z.coerce.number().int().optional().default(12),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { postcode, window } = parsed.data;

  const card = await getPostcodeCard(postcode, window);

  const response = NextResponse.json(card);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  return response;
}
