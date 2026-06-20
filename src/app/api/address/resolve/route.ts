/**
 * GET /api/address/resolve?q=
 *
 * Resolves a typed address or postcode to a single { postcode, lat, lng } via the
 * pluggable address provider (ADDRESS_PROVIDER). The free `postcode` driver
 * extracts the UK postcode and geocodes it; a paid PAF driver can drop in later
 * with no change to callers. Returns `{ resolved: null }` when nothing matches.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAddressProvider } from "@/services/address/address-service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const provider = getAddressProvider();
  const resolved = await provider.resolve(q);

  const response = NextResponse.json({ resolved });
  response.headers.set("Cache-Control", "public, s-maxage=86400");
  return response;
}
