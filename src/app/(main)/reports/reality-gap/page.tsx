import type { Metadata } from "next";
import Link from "next/link";

import { EditionSwitcher } from "@/components/reports/EditionSwitcher";
import { EmbargoGate } from "@/components/reports/EmbargoGate";
import { GapBarChart } from "@/components/reports/GapBarChart";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportStatRow } from "@/components/reports/ReportStatRow";
import { ReportViewTracker } from "@/components/reports/ReportViewTracker";
import {
  AREA_MEDIAN_MIN_ASKING_N,
  AREA_MEDIAN_MIN_SOLD_N,
  MATCHED_PAIR_MIN_N,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ORDER,
  formatGapPct,
  getRealityGapEdition,
  sampleN,
  type RealityGapRow,
  type RealityGapTierData,
} from "@/services/reports/reality-gap-service";

const TITLE = "The Reality Gap";
const DESCRIPTION =
  "What sellers ask versus what buyers actually pay: quarterly asking-price vs sold-price gaps from HM Land Registry Price Paid Data and live TrueDeed listings.";

const HMLR_PPD_URL =
  "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";
const HMLR_SOURCE = { label: "HM Land Registry PPD", url: HMLR_PPD_URL } as const;

const REPORT_KEY = "reality-gap";
const DISTRICT_TABLE_SIZE = 10;

type Props = Readonly<{
  searchParams: Promise<{ edition?: string; preview?: string }>;
}>;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { edition } = await searchParams;
  const ogUrl = `/api/og/report?title=${encodeURIComponent(TITLE)}${
    edition ? `&edition=${encodeURIComponent(edition)}` : ""
  }`;
  return {
    title: `${TITLE} | TrueDeed reports`,
    description: DESCRIPTION,
    alternates: { canonical: "/reports/reality-gap" },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: "/reports/reality-gap",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: TITLE }],
    },
  };
}

function formatPounds(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

/** Dataset JSON-LD: the report is a citable open dataset, not just a page. */
function datasetJsonLd(period: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${TITLE} — ${period}`,
    description: DESCRIPTION,
    license: HMLR_PPD_URL,
    temporalCoverage: period,
    creator: { "@type": "Organization", name: "TrueDeed" },
    isBasedOn: HMLR_PPD_URL,
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: `/api/reports/reality-gap/csv?edition=${encodeURIComponent(period)}`,
    },
  };
}

/** National stat-row inputs for one tier: visible rows only. */
function nationalStats(tier: RealityGapTierData) {
  return PROPERTY_TYPE_ORDER.flatMap((type) => {
    const row = tier.national[type];
    if (!row || !row.visible || row.gapPct === null) return [];
    const asking =
      row.medianAskingPounds !== null ? formatPounds(row.medianAskingPounds) : "—";
    const sold = row.medianSoldPounds !== null ? formatPounds(row.medianSoldPounds) : "—";
    return [
      {
        label: PROPERTY_TYPE_LABELS[type],
        value: formatGapPct(row.gapPct),
        caption: `Median asking ${asking} (n=${row.sampleAskingN.toLocaleString("en-GB")}) vs median sold ${sold} (n=${row.sampleSoldN.toLocaleString("en-GB")}).`,
        source: HMLR_SOURCE,
      },
    ];
  });
}

/** Suppressed national rows for one tier, rendered as text — never numbers. */
function suppressedNationalRows(tier: RealityGapTierData): RealityGapRow[] {
  return PROPERTY_TYPE_ORDER.flatMap((type) => {
    const row = tier.national[type];
    return row && row.suppressed ? [row] : [];
  });
}

function SuppressedList({ rows }: Readonly<{ rows: RealityGapRow[] }>) {
  if (rows.length === 0) return null;
  return (
    <ul className="space-y-1 text-sm text-neutral-600">
      {rows.map((row) => (
        <li key={`${row.tier}-${row.propertyType}`}>
          <span className="font-medium text-neutral-900">
            {PROPERTY_TYPE_LABELS[row.propertyType]}:
          </span>{" "}
          suppressed — sample below threshold (n={sampleN(row).toLocaleString("en-GB")})
        </li>
      ))}
    </ul>
  );
}

function HoldingCopy() {
  return (
    <section
      aria-label="No publishable cells yet"
      className="rounded-2xl border border-border bg-muted p-8"
    >
      <h2 className="font-heading text-xl font-bold text-neutral-900">
        No cells clear the disclosed sample thresholds yet
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        Small-but-honest is the point: we publish nothing below the disclosed
        thresholds ({AREA_MEDIAN_MIN_ASKING_N} asking prices and{" "}
        {AREA_MEDIAN_MIN_SOLD_N} sold transactions per area-median cell;{" "}
        {MATCHED_PAIR_MIN_N} confirmed pairs per matched-pair cell) rather than
        dress thin samples up as findings. As listing coverage and confirmed
        listing-to-sale matches grow, the national gap by property type appears
        first, then the district Truth League — each cell publishes
        automatically the quarter it clears its threshold.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        The methodology, thresholds and no-cherry-picking rule are already
        public:{" "}
        <Link
          href="/reports/reality-gap/methodology"
          className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
        >
          read the methodology
        </Link>
        .
      </p>
    </section>
  );
}

export default async function RealityGapReportPage({ searchParams }: Props) {
  const { edition: editionParam, preview } = await searchParams;
  const { edition, period, availablePeriods } = await getRealityGapEdition(editionParam);

  // All data-backed editions are published; the gate exists for previewing a
  // not-yet-refreshed period via ?edition=<future>&preview=<token>. The
  // default view with no data at all is "published" too — it renders the
  // honest holding copy rather than an embargo panel.
  const requestedPeriod = editionParam ?? period ?? "";
  const published =
    availablePeriods.includes(requestedPeriod) ||
    (editionParam === undefined && availablePeriods.length === 0);

  const heroRow = edition?.tiers.area_median.national.all;
  const heroStat =
    heroRow && heroRow.visible && heroRow.gapPct !== null
      ? {
          label: `National asking vs sold gap — ${edition.period}`,
          value: formatGapPct(heroRow.gapPct),
          caption:
            `Median asking price ${heroRow.medianAskingPounds !== null ? formatPounds(heroRow.medianAskingPounds) : "—"} across ${heroRow.sampleAskingN.toLocaleString("en-GB")} live listings vs median sold price ` +
            `${heroRow.medianSoldPounds !== null ? formatPounds(heroRow.medianSoldPounds) : "—"} across ${heroRow.sampleSoldN.toLocaleString("en-GB")} HM Land Registry Price Paid transactions (trailing 12 months).`,
        }
      : undefined;

  const league = edition?.league ?? [];
  const topDistricts = league.slice(0, DISTRICT_TABLE_SIZE);
  const bottomDistricts =
    league.length > DISTRICT_TABLE_SIZE ? league.slice(-DISTRICT_TABLE_SIZE) : [];

  const csvHref = `/api/reports/reality-gap/csv?edition=${encodeURIComponent(
    edition?.period ?? requestedPeriod,
  )}`;

  return (
    <main>
      {edition && (
        <script
          type="application/ld+json"
          // JSON-LD from DB-derived values; escape "<" so a hostile period
          // string could never close the script tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(datasetJsonLd(edition.period)).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <EmbargoGate
        published={published}
        reportKey={REPORT_KEY}
        edition={requestedPeriod}
        previewToken={preview}
      >
        <ReportShell
          eyebrow="TrueDeed reports"
          title={TITLE}
          strapline="What sellers ask versus what buyers actually pay — measured quarterly, published even when the answer is unflattering, and never below the disclosed sample thresholds."
          heroStat={heroStat}
          methodology={{
            sources: [
              {
                label: "HM Land Registry Price Paid Data (gov.uk)",
                url: HMLR_PPD_URL,
              },
              {
                label: "TrueDeed active sale listings",
                url: "/search",
              },
            ],
            caveats: [
              "Land Registry registrations lag completions by around 3 months, so the most recent sold prices are not yet in the data.",
              "Area medians compare two different populations (what is for sale now vs what sold in the trailing 12 months) — they are cruder than matched pairs.",
              `Cells below the disclosed sample thresholds (${AREA_MEDIAN_MIN_ASKING_N} asking / ${AREA_MEDIAN_MIN_SOLD_N} sold per area cell; ${MATCHED_PAIR_MIN_N} matched pairs) are suppressed, never estimated.`,
            ],
            methodologyHref: "/reports/reality-gap/methodology",
          }}
          shareTitle={`${TITLE} — asking vs sold prices, ${edition?.period ?? requestedPeriod}`}
          shareToolKey="reality_gap"
        >
          {edition ? (
            <>
              <ReportViewTracker report={`reality_gap:${edition.period}`} />

              {availablePeriods.length > 0 && (
                <EditionSwitcher
                  editions={availablePeriods.map((p) => ({
                    id: p,
                    label: p,
                    href: `/reports/reality-gap?edition=${encodeURIComponent(p)}`,
                    current: p === edition.period,
                  }))}
                />
              )}

              {/* Tier 1 — matched pairs. NEVER blended with area medians. */}
              <section aria-labelledby="matched-pair-heading">
                <h2
                  id="matched-pair-heading"
                  className="font-heading text-2xl font-bold text-neutral-900"
                >
                  Matched pairs — the same property, listed then sold
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
                  Each pair is one property we observed as an asking price and
                  then as a confirmed Land Registry completion. High
                  confidence, small n — this is the gap measured on identical
                  properties, not two different populations. We never blend
                  these figures with the area medians below.
                </p>
                <div className="mt-6 space-y-4">
                  {nationalStats(edition.tiers.matched_pair).length > 0 && (
                    <ReportStatRow stats={nationalStats(edition.tiers.matched_pair)} />
                  )}
                  <SuppressedList rows={suppressedNationalRows(edition.tiers.matched_pair)} />
                </div>
              </section>

              {/* Tier 2 — area medians. NEVER blended with matched pairs. */}
              <section aria-labelledby="area-median-heading">
                <h2
                  id="area-median-heading"
                  className="font-heading text-2xl font-bold text-neutral-900"
                >
                  Area medians — what&rsquo;s asked vs what sold nearby
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
                  Median asking price of live listings vs median sold price
                  from HM Land Registry over the trailing 12 months. Two
                  populations compared, larger n, cruder — a market-level
                  signal, not a per-property one. Never blended with the
                  matched pairs above.
                </p>
                <div className="mt-6 space-y-4">
                  {nationalStats(edition.tiers.area_median).length > 0 && (
                    <ReportStatRow stats={nationalStats(edition.tiers.area_median)} />
                  )}
                  <SuppressedList rows={suppressedNationalRows(edition.tiers.area_median)} />
                </div>

                {league.length > 0 && (
                  <div className="mt-10 space-y-10">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-neutral-900">
                        Smallest gaps — asking closest to sold
                      </h3>
                      <GapBarChart
                        className="mt-4"
                        valueSuffix="%"
                        rows={topDistricts.map((entry) => ({
                          label: entry.areaName ?? entry.areaId,
                          value: entry.gapPct ?? 0,
                        }))}
                      />
                    </div>
                    {bottomDistricts.length > 0 && (
                      <div>
                        <h3 className="font-heading text-lg font-bold text-neutral-900">
                          Largest gaps — asking furthest from sold
                        </h3>
                        <GapBarChart
                          className="mt-4"
                          valueSuffix="%"
                          rows={bottomDistricts.map((entry) => ({
                            label: entry.areaName ?? entry.areaId,
                            value: entry.gapPct ?? 0,
                          }))}
                        />
                      </div>
                    )}
                    <p className="text-sm text-neutral-600">
                      {edition.suppressedDistrictCount > 0 && (
                        <>
                          {edition.suppressedDistrictCount.toLocaleString("en-GB")} districts
                          sit below the sample threshold and are not ranked.{" "}
                        </>
                      )}
                      <Link
                        href="/reports/reality-gap/league"
                        className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
                      >
                        See the full Postcode Truth League
                      </Link>
                    </p>
                  </div>
                )}
                {league.length === 0 && (
                  <p className="mt-6 text-sm text-neutral-600">
                    No district clears the disclosed sample thresholds this
                    quarter, so the district table is empty rather than padded.
                  </p>
                )}
              </section>

              <section aria-label="Download the data">
                <p className="text-sm text-neutral-600">
                  Every published (non-suppressed) cell in this edition is
                  downloadable:{" "}
                  <a
                    href={csvHref}
                    className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
                  >
                    download the CSV
                  </a>{" "}
                  or{" "}
                  <Link
                    href="/reports/reality-gap/methodology"
                    className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
                  >
                    read the full methodology
                  </Link>
                  .
                </p>
              </section>
            </>
          ) : (
            <HoldingCopy />
          )}
        </ReportShell>
      </EmbargoGate>
    </main>
  );
}
