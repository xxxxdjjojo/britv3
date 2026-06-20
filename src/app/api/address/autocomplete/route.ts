/**
 * GET /api/address/autocomplete?q= - Postcode suggestions via the pluggable
 * address provider (ADDRESS_PROVIDER). Mirrors /api/geocode's caching.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAddressProvider } from "@/services/address/address-service";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const provider = getAddressProvider();
  const suggestions = await provider.autocomplete(q);

  const response = NextResponse.json({ suggestions });
  response.headers.set("Cache-Control", "public, s-maxage=86400");
  return response;
}
