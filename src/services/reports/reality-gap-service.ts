import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Reality Gap report service (Influence Strategy Phase 2, item 2.1/2.2).
 *
 * Reads the public-read `reality_gap_snapshots` table (populated quarterly by
 * `refresh_reality_gap_snapshots`) and shapes it into one report edition.
 *
 * TWO-TIER RULE (never blended): `matched_pair` rows measure the same
 * property listed then sold (high confidence, small n); `area_median` rows
 * compare two different populations (larger n, cruder). The builder keeps the
 * tiers strictly separate — no figure ever mixes them.
 *
 * SUPPRESSION: rows with `suppressed = true` fail the disclosed sample-size
 * thresholds (area_median: asking ≥ 20 AND sold ≥ 100; matched_pair: pairs
 * ≥ 10) and must never be displayed as figures, ranked in the league, or
 * exported in the CSV.
 */

// Disclosed suppression thresholds — must mirror the c_min_* constants in
// supabase/migrations/20260702210504_reality_gap_snapshots.sql (the DB fn is
// the computer, these are the disclosed copy). Defined in the pure
// reality-gap-thresholds module so client-safe copy can quote them too.
export {
  AREA_MEDIAN_MIN_ASKING_N,
  AREA_MEDIAN_MIN_SOLD_N,
  MATCHED_PAIR_MIN_N,
} from "./reality-gap-thresholds";

export type RealityGapTier = "matched_pair" | "area_median";

export type RealityGapPropertyType =
  | "all"
  | "detached"
  | "semi_detached"
  | "terraced"
  | "flat";

/** Raw `reality_gap_snapshots` row (table is untyped — hand-written shape). */
type RealityGapSnapshotRow = {
  period: string;
  area_level: "national" | "district";
  area_id: string;
  area_name: string | null;
  property_type: RealityGapPropertyType;
  tier: RealityGapTier;
  median_asking_pounds: number | null;
  median_sold_pounds: number | null;
  gap_pct: number | string | null;
  sample_asking_n: number;
  sample_sold_n: number;
  suppressed: boolean;
  methodology_version: number;
  refreshed_at: string;
};

/** One snapshot cell, camel-cased, with the computed `visible` flag. */
export type RealityGapRow = {
  period: string;
  areaLevel: "national" | "district";
  areaId: string;
  areaName: string | null;
  propertyType: RealityGapPropertyType;
  tier: RealityGapTier;
  medianAskingPounds: number | null;
  medianSoldPounds: number | null;
  gapPct: number | null;
  sampleAskingN: number;
  sampleSoldN: number;
  suppressed: boolean;
  /** `!suppressed` — the only rows that may render as figures. */
  visible: boolean;
  methodologyVersion: number;
  refreshedAt: string;
};

export type RealityGapTierData = {
  /** National cells keyed by property type ('all' + the four mapped types). */
  national: Partial<Record<RealityGapPropertyType, RealityGapRow>>;
  /**
   * District cells ('all' only), visible-with-gap rows first ordered by
   * |gap| ascending, then the remainder alphabetically.
   */
  districts: RealityGapRow[];
};

/** Truth-league entry: a visible area_median district row with its rank. */
export type RealityGapLeagueEntry = RealityGapRow & { rank: number };

export type RealityGapEdition = {
  period: string;
  /** The two evidence tiers, kept strictly separate — never blended. */
  tiers: {
    matched_pair: RealityGapTierData;
    area_median: RealityGapTierData;
  };
  /**
   * Postcode Truth League: visible area_median 'all' district rows ranked by
   * |gap_pct| ascending — the smallest asking-vs-sold gap is rank 1 (most
   * honest). Suppressed rows are NEVER ranked.
   */
  league: RealityGapLeagueEntry[];
  /** Districts below the disclosed sample thresholds — counted, not ranked. */
  suppressedDistrictCount: number;
};

export type RealityGapEditionResult = {
  edition: RealityGapEdition | null;
  /** The resolved period the edition was built for (null when none exist). */
  period: string | null;
  /** Every period present in the table, newest first (for EditionSwitcher). */
  availablePeriods: string[];
  /** Flat camel-cased rows for the resolved period (CSV export input). */
  rows: RealityGapRow[];
};

export const PROPERTY_TYPE_ORDER: readonly RealityGapPropertyType[] = [
  "all",
  "detached",
  "semi_detached",
  "terraced",
  "flat",
];

export const PROPERTY_TYPE_LABELS: Record<RealityGapPropertyType, string> = {
  all: "All properties",
  detached: "Detached",
  semi_detached: "Semi-detached",
  terraced: "Terraced",
  flat: "Flat",
};

/** '2026-Q2'-style period strings (sortable within a year). */
const PERIOD_PATTERN = /^\d{4}-Q[1-4]$/;

export function isValidPeriod(value: string): boolean {
  return PERIOD_PATTERN.test(value);
}

/**
 * Binding sample size for a cell — the smaller of the two populations. For
 * matched_pair rows sample_asking_n === sample_sold_n (one pair = one asking
 * observation + one sold observation), so this is simply the pair count.
 */
export function sampleN(
  row: Pick<RealityGapRow, "sampleAskingN" | "sampleSoldN">,
): number {
  return Math.min(row.sampleAskingN, row.sampleSoldN);
}

/** Signed one-decimal percentage, e.g. "+4.2%" / "−1.3%" / "0.0%". */
export function formatGapPct(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  if (value > 0) return `+${rounded}%`;
  if (value < 0) return `−${rounded}%`;
  return `${rounded}%`;
}

function toRealityGapRow(raw: RealityGapSnapshotRow): RealityGapRow {
  const gap = raw.gap_pct === null ? null : Number(raw.gap_pct);
  return {
    period: raw.period,
    areaLevel: raw.area_level,
    areaId: raw.area_id,
    areaName: raw.area_name,
    propertyType: raw.property_type,
    tier: raw.tier,
    medianAskingPounds: raw.median_asking_pounds,
    medianSoldPounds: raw.median_sold_pounds,
    gapPct: gap !== null && Number.isFinite(gap) ? gap : null,
    sampleAskingN: raw.sample_asking_n,
    sampleSoldN: raw.sample_sold_n,
    suppressed: raw.suppressed,
    visible: !raw.suppressed,
    methodologyVersion: raw.methodology_version,
    refreshedAt: raw.refreshed_at,
  };
}

function sortDistricts(districts: readonly RealityGapRow[]): RealityGapRow[] {
  const ranked = districts
    .filter((row) => row.visible && row.gapPct !== null)
    .sort(
      (a, b) =>
        Math.abs(a.gapPct as number) - Math.abs(b.gapPct as number) ||
        (a.areaName ?? a.areaId).localeCompare(b.areaName ?? b.areaId),
    );
  const rest = districts
    .filter((row) => !(row.visible && row.gapPct !== null))
    .sort((a, b) => (a.areaName ?? a.areaId).localeCompare(b.areaName ?? b.areaId));
  return [...ranked, ...rest];
}

function buildTierData(rows: readonly RealityGapRow[], tier: RealityGapTier): RealityGapTierData {
  const tierRows = rows.filter((row) => row.tier === tier);
  const national: Partial<Record<RealityGapPropertyType, RealityGapRow>> = {};
  for (const row of tierRows) {
    if (row.areaLevel === "national") {
      national[row.propertyType] = row;
    }
  }
  const districts = sortDistricts(
    tierRows.filter((row) => row.areaLevel === "district" && row.propertyType === "all"),
  );
  return { national, districts };
}

/**
 * Pure builder: shapes raw snapshot rows into one edition. Tiers are grouped
 * strictly separately; the league ranks ONLY visible (non-suppressed)
 * area_median 'all' district rows by |gap| ascending (smallest gap = most
 * honest = rank 1). Returns null for an empty row set.
 */
export function buildRealityGapEdition(
  rawRows: readonly RealityGapSnapshotRow[],
): RealityGapEdition | null {
  if (rawRows.length === 0) return null;

  const rows = rawRows.map(toRealityGapRow);
  const period = rows[0].period;

  const areaMedian = buildTierData(rows, "area_median");
  const matchedPair = buildTierData(rows, "matched_pair");

  const league: RealityGapLeagueEntry[] = areaMedian.districts
    .filter((row) => row.visible && row.gapPct !== null)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const suppressedDistrictCount = areaMedian.districts.filter(
    (row) => row.suppressed,
  ).length;

  return {
    period,
    tiers: { matched_pair: matchedPair, area_median: areaMedian },
    league,
    suppressedDistrictCount,
  };
}

/** Column order for the public CSV export. */
export const REALITY_GAP_CSV_HEADERS = [
  "period",
  "area_level",
  "area_id",
  "area_name",
  "property_type",
  "tier",
  "median_asking_pounds",
  "median_sold_pounds",
  "gap_pct",
  "sample_asking_n",
  "sample_sold_n",
  "methodology_version",
] as const;

/** UTF-8 byte-order mark so Excel detects the encoding correctly. */
const UTF8_BOM = "\uFEFF";

/**
 * Sanitizes a CSV cell: always quoted, embedded quotes doubled, and
 * formula-triggering leading characters prefixed to prevent Excel formula
 * injection. (Mirrors the agent lead-export csvSafe, which is not exported.)
 */
function csvSafe(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(s)) return `"'${s}"`;
  return `"${s}"`;
}

/**
 * Pure CSV builder for one edition. Suppressed cells NEVER appear in the
 * export — the filter lives here so no caller can accidentally serialise them.
 */
export function buildRealityGapCsv(rows: readonly RealityGapRow[]): string {
  const published = rows.filter((row) => !row.suppressed);
  const lines = [
    REALITY_GAP_CSV_HEADERS.join(","),
    ...published.map((row) =>
      [
        row.period,
        row.areaLevel,
        row.areaId,
        row.areaName,
        row.propertyType,
        row.tier,
        row.medianAskingPounds,
        row.medianSoldPounds,
        row.gapPct,
        row.sampleAskingN,
        row.sampleSoldN,
        row.methodologyVersion,
      ]
        .map(csvSafe)
        .join(","),
    ),
  ];
  return `${UTF8_BOM}${lines.join("\r\n")}\r\n`;
}

/**
 * Fetches one edition of the Reality Gap report (default: the latest period
 * present in the table). Never throws — returns a null edition on error or
 * when no rows exist for the requested period.
 */
export async function getRealityGapEdition(
  period?: string,
): Promise<RealityGapEditionResult> {
  const empty: RealityGapEditionResult = {
    edition: null,
    period: null,
    availablePeriods: [],
    rows: [],
  };

  try {
    const supabase = await createClient();

    const { data: periodRows, error: periodsError } = await supabase
      .from("reality_gap_snapshots")
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
      .from("reality_gap_snapshots")
      .select(
        "period, area_level, area_id, area_name, property_type, tier, " +
          "median_asking_pounds, median_sold_pounds, gap_pct, " +
          "sample_asking_n, sample_sold_n, suppressed, methodology_version, refreshed_at",
      )
      .eq("period", resolvedPeriod);
    if (error) return { ...empty, availablePeriods };

    const rawRows = (data ?? []) as unknown as RealityGapSnapshotRow[];
    const edition = buildRealityGapEdition(rawRows);
    return {
      edition,
      period: edition ? resolvedPeriod : null,
      availablePeriods,
      rows: rawRows.map(toRealityGapRow),
    };
  } catch {
    return empty;
  }
}
