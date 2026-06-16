/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Broadband availability for the property-detail Local Area widget.
 *
 * Data is served from our own `broadband_coverage` table (Ofcom Connected
 * Nations 2025 fixed postcode data, Open Government Licence v3.0), populated
 * out-of-band by scripts/ingest-ofcom-broadband.mjs. Lookup is a direct
 * primary-key read on the normalised postcode — no external API at render time.
 *
 * Returns null on any error or when the postcode is not covered, so callers
 * degrade by absence (never render an empty widget). The postcode is never
 * echoed in error logs.
 */

import { createClient } from "@/lib/supabase/server";

export type BroadbandCoverage = Readonly<{
  superfastPct: number | null; // SFBB, >=30 Mbit/s
  ultrafastPct: number | null; // UFBB, >=300 Mbit/s
  gigabitPct: number | null; // gigabit-capable
  belowUsoPct: number | null; // premises below the Universal Service Obligation
}>;

type CoverageRow = {
  sfbb_pct: number | string | null;
  ufbb_pct: number | string | null;
  gigabit_pct: number | string | null;
  below_uso_pct: number | string | null;
};

/** Normalise a postcode to the table's key form: uppercase, no whitespace. */
export function normalisePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, "");
}

/** numeric columns may arrive as JS numbers or numeric strings — coerce safely. */
function toNum(value: number | string | null): number | null {
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetch broadband availability for a postcode. Returns null when the postcode
 * is not in the dataset or the lookup fails.
 */
export async function getBroadbandCoverage(
  postcode: string,
): Promise<BroadbandCoverage | null> {
  const normalised = normalisePostcode(postcode);
  if (!normalised) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("broadband_coverage")
      .select("sfbb_pct, ufbb_pct, gigabit_pct, below_uso_pct")
      .eq("postcode", normalised)
      .maybeSingle();

    if (error) {
      console.error("[broadband-service] lookup failed", {
        error_type: error.code ?? "unknown",
      });
      return null;
    }
    if (!data) return null;

    const row = data as CoverageRow;
    return {
      superfastPct: toNum(row.sfbb_pct),
      ultrafastPct: toNum(row.ufbb_pct),
      gigabitPct: toNum(row.gigabit_pct),
      belowUsoPct: toNum(row.below_uso_pct),
    };
  } catch (error) {
    console.error("[broadband-service] lookup error", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}
