import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Time-to-Sell tracker service (Influence Strategy Phase 2, item 2.5).
 *
 * Reads the public-read `time_to_sell_snapshots` table (populated quarterly
 * by `refresh_time_to_sell_snapshots`) and shapes it into one report edition.
 *
 * The metric is median days from listing to COMPLETION (Land Registry
 * transfer date), computed ONLY from confirmed PPD↔listing matched pairs —
 * never from "under offer" dates or unverified matches.
 *
 * SUPPRESSION: rows with `suppressed = true` fail the disclosed sample
 * threshold (fewer than 15 matched sales in the trailing 12 months) and must
 * never be displayed as figures or ranked. The coverage counts are published
 * instead — the suppression itself is part of the report.
 */

/** Disclosed suppression threshold — mirrors `c_min_pairs` in the refresh fn. */
export const TIME_TO_SELL_MIN_PAIRS = 15;

/** Raw `time_to_sell_snapshots` row (table is untyped — hand-written shape). */
type TimeToSellSnapshotRow = {
  period: string;
  area_level: "national" | "district";
  area_id: string;
  area_name: string | null;
  median_days: number | null;
  sample_n: number;
  suppressed: boolean;
  methodology_version: number;
  refreshed_at: string;
};

/** One snapshot row, camel-cased, with the computed `visible` flag. */
export type TimeToSellRow = {
  period: string;
  areaLevel: "national" | "district";
  areaId: string;
  areaName: string | null;
  medianDays: number | null;
  sampleN: number;
  suppressed: boolean;
  /** `!suppressed` — the only rows that may render as figures. */
  visible: boolean;
  methodologyVersion: number;
  refreshedAt: string;
};

export type TimeToSellEdition = {
  period: string;
  /**
   * The national row — kept even when suppressed so the page can show the
   * honest matched-pair count. Null only when the refresh never ran.
   */
  national: TimeToSellRow | null;
  /** VISIBLE districts only, ranked fastest first (median days ascending). */
  districts: TimeToSellRow[];
  /** District rows below the disclosed threshold — counted, never ranked. */
  suppressedCount: number;
  /** Coverage transparency: what published vs what stayed suppressed. */
  coverage: {
    districtsPublished: number;
    districtsSuppressed: number;
  };
};

export type TimeToSellEditionResult = {
  edition: TimeToSellEdition | null;
  /** The resolved period the edition was built for (null when none exist). */
  period: string | null;
  /** Every period present in the table, newest first (for EditionSwitcher). */
  availablePeriods: string[];
};

function toTimeToSellRow(raw: TimeToSellSnapshotRow): TimeToSellRow {
  const days = raw.median_days === null ? null : Number(raw.median_days);
  return {
    period: raw.period,
    areaLevel: raw.area_level,
    areaId: raw.area_id,
    areaName: raw.area_name,
    medianDays: days !== null && Number.isFinite(days) ? days : null,
    sampleN: raw.sample_n,
    suppressed: raw.suppressed,
    visible: !raw.suppressed,
    methodologyVersion: raw.methodology_version,
    refreshedAt: raw.refreshed_at,
  };
}

/**
 * Pure builder: shapes raw snapshot rows into one edition. The district list
 * contains ONLY visible (non-suppressed) rows, ranked by median days
 * ascending (fastest to sell first, name as tie-break); suppressed districts
 * are counted, never listed. Returns null for an empty row set.
 */
export function buildTimeToSellEdition(
  rawRows: readonly TimeToSellSnapshotRow[],
): TimeToSellEdition | null {
  if (rawRows.length === 0) return null;

  const rows = rawRows.map(toTimeToSellRow);
  const period = rows[0].period;

  const national = rows.find((row) => row.areaLevel === "national") ?? null;
  const districtRows = rows.filter((row) => row.areaLevel === "district");

  const districts = districtRows
    .filter((row) => row.visible && row.medianDays !== null)
    .sort(
      (a, b) =>
        (a.medianDays as number) - (b.medianDays as number) ||
        (a.areaName ?? a.areaId).localeCompare(b.areaName ?? b.areaId),
    );

  const suppressedCount = districtRows.filter((row) => row.suppressed).length;

  return {
    period,
    national,
    districts,
    suppressedCount,
    coverage: {
      districtsPublished: districts.length,
      districtsSuppressed: suppressedCount,
    },
  };
}

/**
 * Fetches one edition of the Time-to-Sell tracker (default: the latest
 * period present in the table). Never throws — returns a null edition on
 * error or when no rows exist for the requested period.
 */
export async function getTimeToSellEdition(
  period?: string,
): Promise<TimeToSellEditionResult> {
  const empty: TimeToSellEditionResult = {
    edition: null,
    period: null,
    availablePeriods: [],
  };

  try {
    const supabase = await createClient();

    const { data: periodRows, error: periodsError } = await supabase
      .from("time_to_sell_snapshots")
      .select("period")
      .order("period", { ascending: false })
      .limit(10000);
    if (periodsError) return empty;

    const availablePeriods = [
      ...new Set(((periodRows ?? []) as { period: string }[]).map((r) => r.period)),
    ];
    if (availablePeriods.length === 0) return empty;

    const resolvedPeriod = period ?? availablePeriods[0];
    if (!availablePeriods.includes(resolvedPeriod)) {
      return { ...empty, availablePeriods };
    }

    const { data, error } = await supabase
      .from("time_to_sell_snapshots")
      .select(
        "period, area_level, area_id, area_name, median_days, sample_n, " +
          "suppressed, methodology_version, refreshed_at",
      )
      .eq("period", resolvedPeriod);
    if (error) return { ...empty, availablePeriods };

    const edition = buildTimeToSellEdition(
      (data ?? []) as unknown as TimeToSellSnapshotRow[],
    );
    return {
      edition,
      period: edition ? resolvedPeriod : null,
      availablePeriods,
    };
  } catch {
    return empty;
  }
}
