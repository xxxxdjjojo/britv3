import { NextResponse } from "next/server";
import { isFeatureEnabled, features } from "@/lib/features";
import { searchProperties } from "@/app/(main)/search/actions";

/**
 * TEMPORARY read-only diagnostic for the "live search shows 0 results" bug.
 * Exposes how the production runtime resolves the search feature flags so we can
 * see whether the NEXT_PUBLIC value reaches the server at runtime. Exposes only
 * the boolean/string flag state (NEXT_PUBLIC_*, non-secret) — never other env.
 * Remove once the root cause is confirmed.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const KEY = "NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA";
  const LIVE = "NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA";

  let rentCount: number | null = null;
  let rentError: string | null = null;
  try {
    rentCount = (await searchProperties({ listingType: "rent" })).data.length;
  } catch (e) {
    rentError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    note: "temporary diagnostic — remove after root cause confirmed",
    isFeatureEnabled: {
      search_mock_data: isFeatureEnabled("search_mock_data"),
      search_live_data: isFeatureEnabled("search_live_data"),
    },
    raw_static: {
      // static member access — webpack/Next inlines this at build
      search_mock_data: process.env.NEXT_PUBLIC_ENABLE_SEARCH_MOCK_DATA ?? null,
      search_live_data: process.env.NEXT_PUBLIC_ENABLE_SEARCH_LIVE_DATA ?? null,
    },
    raw_dynamic: {
      // computed-key access — runtime read of the live environment
      search_mock_data: process.env[KEY] ?? null,
      search_live_data: process.env[LIVE] ?? null,
    },
    next_public_enable_keys: Object.keys(process.env)
      .filter((k) => k.startsWith("NEXT_PUBLIC_ENABLE_"))
      .sort(),
    features: features(),
    rent_search_count: rentCount,
    rent_search_error: rentError,
  });
}
