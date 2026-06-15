import { NextResponse } from "next/server";
import { z } from "zod";
import { parseMarketMapQuery } from "@/lib/market-map/query";
import { cached } from "@/lib/market-map/cache";
import { getRecentTransactions } from "@/services/market-map/market-map-service";

/**
 * GET /api/market-map/transactions
 *
 * Recent registered sold-price transactions for a borough (optionally a single
 * sub-area via `sub_area`). Public endpoint.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseMarketMapQuery(searchParams);
    const subArea = searchParams.get("sub_area") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 12);

    const key = `market-map-txns:${JSON.stringify(query)}:${subArea ?? ""}:${limit}`;
    const data = await cached(key, () =>
      getRecentTransactions(query, { subArea, limit }),
    );
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: err.flatten() },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
