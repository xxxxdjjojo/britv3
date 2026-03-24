import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LandRegistryComparable } from "@/types/seller";

const LR_BASE = "https://landregistry.data.gov.uk/app/ppd/ppd_data.csv";

async function fetchLandRegistryData(postcode: string): Promise<LandRegistryComparable[]> {
  const encoded = postcode.replace(/ /g, "+");
  const url = `${LR_BASE}?postcode=${encoded}&max_rows=10&format=csv`;

  const res = await fetch(url, {
    headers: { Accept: "text/csv" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return [];
  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const comparables: LandRegistryComparable[] = [];
  for (const line of lines.slice(1, 11)) {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const price = parseInt(cols[1] ?? "0", 10);
    const date = cols[2] ?? "";
    const pc = cols[3] ?? postcode;
    const pType = cols[4] ?? "F";
    const duration = cols[6] ?? "F";
    const paon = cols[7] ?? "";
    const street = cols[9] ?? "";

    if (!price || !date) continue;

    const typeMap: Record<string, string> = {
      D: "Detached", S: "Semi-detached", T: "Terraced", F: "Flat/Maisonette", O: "Other",
    };
    const tenureMap: Record<string, string> = { F: "Freehold", L: "Leasehold" };

    comparables.push({
      address: [paon, street].filter(Boolean).join(" "),
      postcode: pc,
      price: price * 100,
      sale_date: date.split(" ")[0] ?? date,
      property_type: typeMap[pType] ?? pType,
      tenure: tenureMap[duration] ?? duration,
      distance_metres: null,
    });
  }
  return comparables;
}

function estimateValue(comparables: LandRegistryComparable[]): number {
  if (!comparables.length) return 0;
  const avg = comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length;
  return Math.round(avg);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode");
  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  try {
    const comparables = await fetchLandRegistryData(postcode);
    const estimate = estimateValue(comparables);
    const margin = Math.round(estimate * 0.1);

    return NextResponse.json({
      postcode,
      comparables,
      ai_estimate: estimate,
      estimate_low: estimate - margin,
      estimate_high: estimate + margin,
      confidence: comparables.length >= 5 ? 75 : comparables.length >= 2 ? 50 : 25,
      based_on: comparables.length,
    });
  } catch (err) {
    console.error("[api/seller/valuation] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
