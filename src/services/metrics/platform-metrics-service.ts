import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Open Metrics (/metrics) — Influence Strategy Phase 2, Campaign 44.
 *
 * `computeDailyMetrics` runs nightly under the service role (Inngest
 * platform-metrics-daily) and snapshots ONLY metrics the live schema can
 * compute reliably. A metric whose query fails is OMITTED for that day —
 * never written as a fabricated 0 — so "0 rows" and "query failed" stay
 * distinguishable on the public page (failed days render as gaps).
 *
 * Metric definitions are VERSIONED on the /metrics page
 * (METRIC_DEFINITIONS_VERSION). A definition change means a NEW metric key,
 * never a silent redefinition of an existing one.
 */

export const METRIC_KEYS = [
  "active_sale_listings",
  "active_rent_listings",
  "registered_users",
  "messages_30d",
  "valuations_generated",
  "content_reports_open",
  "content_reports_resolved",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export type DailyMetricRow = {
  metric: MetricKey;
  value: number;
  meta?: Record<string, unknown>;
};

/** Trailing window shown on the page and used for sparklines / uptime. */
export const SERIES_WINDOW_DAYS = 30;
/** Availability % is published only once this many probes exist (disclosed). */
export const MIN_UPTIME_PROBES = 100;
/** Median resolution time is published only from this many resolved reports. */
export const MIN_RESOLVED_REPORTS = 10;
/** Median-resolution sample cap: most recently resolved reports considered. */
const RESOLVED_SAMPLE_CAP = 5000;

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC calendar date (YYYY-MM-DD) for a timestamp. */
export function utcDay(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

function daysAgoIso(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() - days * DAY_MS).toISOString();
}

// ---------------------------------------------------------------------------
// Pure builders (unit-tested)
// ---------------------------------------------------------------------------

export type SeriesPoint = {
  day: string;
  /** null = no snapshot recorded that day (job failure/omission) — a GAP, not 0. */
  value: number | null;
};

/**
 * Fill a daily series over the trailing window. Days with no recorded row
 * become `value: null` gaps — a missed nightly run must never render as a
 * fake zero.
 */
export function buildSeries(
  rows: ReadonlyArray<{ day: string; value: number }>,
  options: Readonly<{ days?: number; end?: string }> = {},
): SeriesPoint[] {
  const days = options.days ?? SERIES_WINDOW_DAYS;
  const end = options.end ?? utcDay();
  const byDay = new Map(rows.map((r) => [r.day, r.value]));
  const endMs = new Date(`${end}T00:00:00Z`).getTime();

  return Array.from({ length: days }, (_, i) => {
    const day = new Date(endMs - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10);
    return { day, value: byDay.get(day) ?? null };
  });
}

export type UptimeSummary = {
  probeCount: number;
  okCount: number;
  /** null while gated (probeCount < MIN_UPTIME_PROBES) — never a guess. */
  availabilityPct: number | null;
};

/**
 * Trailing-30d availability from external probe counts. Published only once
 * MIN_UPTIME_PROBES probes exist; below the gate the page shows live status
 * only. Counts (not raw rows) because a 30-day window at 15-minute cadence
 * exceeds PostgREST's 1000-row response cap — the two head-counts are exact.
 */
export function buildUptime(okCount: number, probeCount: number): UptimeSummary {
  if (probeCount < MIN_UPTIME_PROBES) {
    return { probeCount, okCount, availabilityPct: null };
  }
  const pct = (okCount / probeCount) * 100;
  return { probeCount, okCount, availabilityPct: Math.round(pct * 100) / 100 };
}

/**
 * Median resolution time (hours) across resolved content reports. Returns
 * null below MIN_RESOLVED_REPORTS or when timestamps are unusable — the page
 * then says "not enough data yet" instead of showing a shaky number.
 */
export function buildMedianResolutionHours(
  rows: ReadonlyArray<{ created_at: string; resolved_at: string | null }>,
): number | null {
  const durations = rows
    .flatMap((r) => {
      if (!r.resolved_at) return [];
      const ms = new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime();
      return Number.isFinite(ms) && ms >= 0 ? [ms] : [];
    })
    .sort((a, b) => a - b);

  if (durations.length < MIN_RESOLVED_REPORTS) return null;

  const mid = Math.floor(durations.length / 2);
  const medianMs =
    durations.length % 2 === 1 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;
  return Math.round((medianMs / (60 * 60 * 1000)) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Nightly compute + upsert (service role)
// ---------------------------------------------------------------------------

type CountQuery = PromiseLike<{ count: number | null; error: PostgrestError | null }>;

/** Exact head-count; null (not 0) when the query fails, so callers can omit. */
async function countOrNull(query: CountQuery): Promise<number | null> {
  try {
    const { count, error } = await query;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function computeDailyMetrics(admin: SupabaseClient): Promise<DailyMetricRow[]> {
  const now = new Date();

  const [
    activeSale,
    activeRent,
    registeredUsers,
    messages30d,
    valuations,
    reportsOpen,
    reportsResolved,
  ] = await Promise.all([
    countOrNull(
      admin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null)
        .eq("listing_type", "sale"),
    ),
    countOrNull(
      admin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null)
        .eq("listing_type", "rent"),
    ),
    countOrNull(admin.from("profiles").select("id", { count: "exact", head: true })),
    countOrNull(
      admin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", daysAgoIso(30, now)),
    ),
    countOrNull(
      admin
        .from("valuation_sessions")
        .select("id", { count: "exact", head: true })
        .in("status", ["calculated", "claimed"]),
    ),
    countOrNull(
      admin
        .from("content_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ),
    countOrNull(
      admin
        .from("content_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved"),
    ),
  ]);

  const rows: DailyMetricRow[] = [];
  const push = (metric: MetricKey, value: number | null, meta?: Record<string, unknown>) => {
    // Failed query → OMIT the metric for this day (gap on the page), never 0.
    if (value === null) return;
    rows.push(meta ? { metric, value, meta } : { metric, value });
  };

  push("active_sale_listings", activeSale);
  push("active_rent_listings", activeRent);
  push("registered_users", registeredUsers);
  push("messages_30d", messages30d);
  push("valuations_generated", valuations);
  push("content_reports_open", reportsOpen);
  push(
    "content_reports_resolved",
    reportsResolved,
    reportsResolved === null ? undefined : await resolvedReportsMeta(admin),
  );

  return rows;
}

/**
 * Meta for content_reports_resolved: median resolution hours over the most
 * recently resolved reports (capped sample, disclosed on the page). Published
 * only from MIN_RESOLVED_REPORTS resolved rows.
 */
async function resolvedReportsMeta(
  admin: SupabaseClient,
): Promise<Record<string, unknown> | undefined> {
  try {
    const { data, error } = await admin
      .from("content_reports")
      .select("created_at, resolved_at")
      .eq("status", "resolved")
      .order("resolved_at", { ascending: false })
      .limit(RESOLVED_SAMPLE_CAP);
    if (error || !data) return undefined;

    const rows = data as Array<{ created_at: string; resolved_at: string | null }>;
    const medianHours = buildMedianResolutionHours(rows);
    return {
      resolved_sample_n: rows.length,
      median_resolution_hours: medianHours,
    };
  } catch {
    return undefined;
  }
}

export async function upsertDailyMetrics(
  admin: SupabaseClient,
  day: string,
  rows: ReadonlyArray<DailyMetricRow>,
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await admin.from("platform_metrics_daily").upsert(
    rows.map((r) => ({ metric: r.metric, day, value: r.value, meta: r.meta ?? {} })),
    { onConflict: "metric,day" },
  );
  if (error) {
    throw new Error(`platform_metrics_daily upsert failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Page read model (anon client; every table here is public-read RLS)
// ---------------------------------------------------------------------------

export type MetricSnapshot = {
  key: MetricKey;
  latestValue: number;
  latestDay: string;
  /** First day this metric key was ever recorded (shown as "tracked since"). */
  sinceDay: string;
  series: SeriesPoint[];
  meta: Record<string, unknown>;
};

export type TimeToSellSnapshot = {
  period: string;
  medianDays: number | null;
  sampleN: number;
  suppressed: boolean;
};

export type MetricsPageData = {
  metrics: Partial<Record<MetricKey, MetricSnapshot>>;
  uptime: UptimeSummary;
  latestUptimeCheck: { ok: boolean; checkedAt: string; latencyMs: number | null } | null;
  timeToSell: TimeToSellSnapshot | null;
};

export async function getMetricsPageData(): Promise<MetricsPageData> {
  const supabase = await createClient();
  const now = new Date();
  const windowStartDay = utcDay(new Date(now.getTime() - (SERIES_WINDOW_DAYS - 1) * DAY_MS));
  const uptimeWindowStart = daysAgoIso(SERIES_WINDOW_DAYS, now);

  const [dailyRes, sinceRes, uptimeTotal, uptimeOk, latestCheckRes, ttsRes] = await Promise.all([
    supabase
      .from("platform_metrics_daily")
      .select("metric, day, value, meta")
      .gte("day", windowStartDay)
      .order("day", { ascending: true }),
    // Small table (a handful of rows per day) — first-seen day per metric.
    supabase.from("platform_metrics_daily").select("metric, day").order("day", { ascending: true }),
    countOrNull(
      supabase
        .from("uptime_checks")
        .select("id", { count: "exact", head: true })
        .gte("checked_at", uptimeWindowStart),
    ),
    countOrNull(
      supabase
        .from("uptime_checks")
        .select("id", { count: "exact", head: true })
        .gte("checked_at", uptimeWindowStart)
        .eq("ok", true),
    ),
    supabase
      .from("uptime_checks")
      .select("ok, checked_at, latency_ms")
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("time_to_sell_snapshots")
      .select("period, median_days, sample_n, suppressed")
      .eq("area_level", "national")
      .order("refreshed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const daily = (dailyRes.data ?? []) as Array<{
    metric: string;
    day: string;
    value: number;
    meta: Record<string, unknown> | null;
  }>;
  const sinceRows = (sinceRes.data ?? []) as Array<{ metric: string; day: string }>;

  const sinceByMetric = new Map<string, string>();
  for (const row of sinceRows) {
    if (!sinceByMetric.has(row.metric)) sinceByMetric.set(row.metric, row.day);
  }

  const metrics: Partial<Record<MetricKey, MetricSnapshot>> = {};
  for (const key of METRIC_KEYS) {
    const rows = daily.filter((r) => r.metric === key);
    if (rows.length === 0) continue;
    const latest = rows[rows.length - 1];
    metrics[key] = {
      key,
      latestValue: Number(latest.value),
      latestDay: latest.day,
      sinceDay: sinceByMetric.get(key) ?? latest.day,
      series: buildSeries(
        rows.map((r) => ({ day: r.day, value: Number(r.value) })),
        { end: utcDay(now) },
      ),
      meta: latest.meta ?? {},
    };
  }

  const latestCheck = latestCheckRes.data as {
    ok: boolean;
    checked_at: string;
    latency_ms: number | null;
  } | null;
  const tts = ttsRes.data as {
    period: string;
    median_days: number | null;
    sample_n: number;
    suppressed: boolean;
  } | null;

  return {
    metrics,
    uptime: buildUptime(uptimeOk ?? 0, uptimeTotal ?? 0),
    latestUptimeCheck: latestCheck
      ? { ok: latestCheck.ok, checkedAt: latestCheck.checked_at, latencyMs: latestCheck.latency_ms }
      : null,
    timeToSell: tts
      ? {
          period: tts.period,
          medianDays: tts.median_days,
          sampleN: tts.sample_n,
          suppressed: tts.suppressed,
        }
      : null,
  };
}
