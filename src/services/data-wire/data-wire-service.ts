import "server-only";

import {
  getRealityGapEdition,
  type RealityGapLeagueEntry,
} from "@/services/reports/reality-gap-service";
import {
  formatSignedGapPct,
  pressPackToPlainText,
  type PressPack,
} from "@/content/data-wire/templates";

/**
 * Local Paper Data Wire service (Influence Phase 2, 2.6).
 *
 * Reuses the Reality Gap report builders: `getRealityGapEdition` already
 * excludes suppressed rows from the league and ranks visible district
 * `area_median` 'all' rows by |gap_pct| ascending. This service shapes that
 * league into "wire areas" the founder can generate press packs for, and
 * renders one pack as a self-contained HTML file.
 *
 * DECISION: no zip dependency exists in the repo and none is added — the
 * downloadable pack is a single self-contained, print-friendly HTML document
 * (copy headline/paragraphs as text + linked OG chart PNGs + methodology).
 */

export type WireArea = Readonly<{
  areaId: string;
  areaName: string;
  period: string;
  gapPct: number;
  medianAskingPounds: number;
  medianSoldPounds: number;
  sampleAskingN: number;
  sampleSoldN: number;
  /** Truth-league rank (1 = smallest |gap|). */
  rank: number;
  totalRanked: number;
}>;

export type WireAreasResult = Readonly<{
  /** Resolved edition period (null when no data exists). */
  period: string | null;
  availablePeriods: readonly string[];
  /** Visible (non-suppressed) district area_median 'all' rows with ranks. */
  areas: readonly WireArea[];
}>;

export type PackChartUrls = Readonly<{
  /** Absolute URL of the Truth League OG PNG. */
  league: string;
  /** Absolute URL of the report-stat OG PNG. */
  report: string;
}>;

/**
 * Pure: maps ranked league entries to wire areas. Entries missing a median
 * (nothing to quote) are dropped; areaName falls back to the areaId slug.
 */
export function buildWireAreas(
  league: readonly RealityGapLeagueEntry[],
): WireArea[] {
  const totalRanked = league.length;
  return league
    .filter(
      (entry) =>
        entry.gapPct !== null &&
        entry.medianAskingPounds !== null &&
        entry.medianSoldPounds !== null,
    )
    .map((entry) => ({
      areaId: entry.areaId,
      areaName: entry.areaName ?? entry.areaId,
      period: entry.period,
      gapPct: entry.gapPct as number,
      medianAskingPounds: entry.medianAskingPounds as number,
      medianSoldPounds: entry.medianSoldPounds as number,
      sampleAskingN: entry.sampleAskingN,
      sampleSoldN: entry.sampleSoldN,
      rank: entry.rank,
      totalRanked,
    }));
}

/**
 * Loads the wire areas for the latest (or requested) period. Suppressed
 * districts are never returned — the underlying league excludes them.
 * Never throws.
 */
export async function getWireAreas(period?: string): Promise<WireAreasResult> {
  try {
    const { edition, period: resolvedPeriod, availablePeriods } =
      await getRealityGapEdition(period);
    if (!edition || !resolvedPeriod) {
      return { period: null, availablePeriods, areas: [] };
    }
    return {
      period: resolvedPeriod,
      availablePeriods,
      areas: buildWireAreas(edition.league),
    };
  } catch {
    return { period: null, availablePeriods: [], areas: [] };
  }
}

/** Escapes a string for safe interpolation into HTML text/attributes. */
function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => replacements[char]);
}

/**
 * Pure: renders one press pack as a single self-contained HTML document
 * (inline styles only, print-friendly). All interpolated strings are
 * HTML-escaped — XSS hygiene even though the output is admin-generated.
 */
export function buildPackHtml(
  pack: PressPack,
  chartUrls: PackChartUrls,
  meta: Readonly<{ areaName: string; period: string }>,
): string {
  const title = escapeHtml(`${pack.headline} — TrueDeed Data Wire`);
  const area = escapeHtml(meta.areaName);
  const period = escapeHtml(meta.period);
  const league = escapeHtml(chartUrls.league);
  const report = escapeHtml(chartUrls.report);
  const paragraphsHtml = pack.paragraphs
    .map((paragraph) => `      <p>${escapeHtml(paragraph)}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:32px;background:#faf9f6;color:#1f2937;font-family:Georgia,'Times New Roman',serif;line-height:1.6;">
  <main style="max-width:720px;margin:0 auto;">
    <header style="border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">TrueDeed Data Wire &middot; ${area} &middot; ${period}</p>
      <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;">${escapeHtml(pack.headline)}</h1>
    </header>

    <section aria-label="Story copy">
${paragraphsHtml}
    </section>

    <section aria-label="Chart images" style="margin-top:24px;">
      <h2 style="font-size:16px;font-family:Arial,Helvetica,sans-serif;">Chart images (1200&times;630 PNG, free to reuse with attribution)</h2>
      <figure style="margin:12px 0;">
        <img src="${league}" alt="Postcode Truth League position for ${area}" width="600" height="315" style="max-width:100%;height:auto;border:1px solid #d1d5db;" />
        <figcaption style="font-size:12px;color:#6b7280;word-break:break-all;">Download: <a href="${league}">${league}</a></figcaption>
      </figure>
      <figure style="margin:12px 0;">
        <img src="${report}" alt="Reality Gap headline stat for ${area}" width="600" height="315" style="max-width:100%;height:auto;border:1px solid #d1d5db;" />
        <figcaption style="font-size:12px;color:#6b7280;word-break:break-all;">Download: <a href="${report}">${report}</a></figcaption>
      </figure>
    </section>

    <section aria-label="Methodology" style="margin-top:24px;border-top:1px solid #d1d5db;padding-top:16px;">
      <h2 style="font-size:16px;font-family:Arial,Helvetica,sans-serif;">Methodology</h2>
      <p style="font-size:14px;color:#374151;">${escapeHtml(pack.boilerplate)}</p>
      <p style="font-size:14px;font-weight:bold;">${escapeHtml(pack.attribution)}</p>
    </section>

    <section aria-label="Plain text for copy and paste" style="margin-top:24px;border-top:1px solid #d1d5db;padding-top:16px;">
      <h2 style="font-size:16px;font-family:Arial,Helvetica,sans-serif;">Plain text (copy &amp; paste)</h2>
      <pre style="white-space:pre-wrap;font-family:'Courier New',monospace;font-size:13px;background:#ffffff;border:1px solid #d1d5db;padding:16px;">${escapeHtml(pressPackToPlainText(pack))}</pre>
    </section>
  </main>
</body>
</html>
`;
}

/** Builds the two absolute OG chart URLs for a wire area. */
export function buildChartUrls(
  area: WireArea,
  headline: string,
  toAbsoluteUrl: (path: string) => string,
): PackChartUrls {
  const leagueParams = new URLSearchParams({
    area: area.areaName,
    rank: String(area.rank),
    gapPct: String(area.gapPct),
  });
  const reportParams = new URLSearchParams({
    title: headline,
    stat: formatSignedGapPct(area.gapPct),
    statLabel: `Asking vs sold gap — ${area.areaName}`,
    edition: area.period,
  });
  return {
    league: toAbsoluteUrl(`/api/og/league?${leagueParams.toString()}`),
    report: toAbsoluteUrl(`/api/og/report?${reportParams.toString()}`),
  };
}
