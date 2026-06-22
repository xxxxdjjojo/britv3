/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  averageSoldPrice,
  classifyComparableEvidence,
  parseLandRegistryComparables,
  soldPriceRange,
} from "@/lib/seller/sold-price-comparables";

const LR_BASE = "https://landregistry.data.gov.uk/app/ppd/ppd_data.csv";

async function fetchLandRegistryCsv(postcode: string): Promise<string> {
  const encoded = postcode.replace(/ /g, "+");
  const url = `${LR_BASE}?postcode=${encoded}&max_rows=10&format=csv`;

  const res = await fetch(url, {
    headers: { Accept: "text/csv" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return "";
  return res.text();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode");
  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  try {
    const csv = await fetchLandRegistryCsv(postcode);
    const comparables = parseLandRegistryComparables(csv, postcode);
    const estimate = averageSoldPrice(comparables);
    const { low, high } = soldPriceRange(comparables);

    return NextResponse.json({
      postcode,
      comparables,
      estimate,
      range_low: low,
      range_high: high,
      based_on: comparables.length,
      evidence: classifyComparableEvidence(comparables.length),
    });
  } catch (err) {
    console.error("[api/seller/valuation] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
