/**
 * GET /api/market-map/version
 *
 * Returns the current market-map precompute token. The client fetches this once
 * to build immutable tile URLs (`/api/market-map/tiles/{z}/{x}/{y}?v=<version>`),
 * so a precompute rebuild yields fresh URLs and busts the edge cache.
 */

import { NextResponse } from "next/server";
import { getDataVersion } from "@/services/market-map/tile-service";

export async function GET(): Promise<NextResponse> {
  const version = await getDataVersion();
  const response = NextResponse.json({ version });
  response.headers.set("Cache-Control", "public, s-maxage=60");
  return response;
}
