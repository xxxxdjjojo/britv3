import type { Metadata } from "next";
import Link from "next/link";

import { EditionSwitcher } from "@/components/reports/EditionSwitcher";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportViewTracker } from "@/components/reports/ReportViewTracker";
import {
  TIME_TO_SELL_MIN_PAIRS,
  getTimeToSellEdition,
  type TimeToSellEdition,
} from "@/services/reports/time-to-sell-service";

const TITLE = "Time to Sell";
const DESCRIPTION =
  "Median days from listing to completion, measured on confirmed Land Registry matched sales — the honest end-to-end number, not a portal 'time to under offer'.";

const HMLR_PPD_URL =
  "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";

type Props = Readonly<{
  searchParams: Promise<{ edition?: string }>;
}>;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { edition } = await searchParams;
  const ogUrl = `/api/og/report?title=${encodeURIComponent(TITLE)}${
    edition ? `&edition=${encodeURIComponent(edition)}` : ""
  }`;
  return {
    title: `${TITLE} | TrueDeed reports`,
    description: DESCRIPTION,
    alternates: { canonical: "/reports/time-to-sell" },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: "/reports/time-to-sell",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: TITLE }],
    },
  };
}

/** Dataset JSON-LD: the tracker is a citable open dataset, not just a page. */
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
  };
}

const METHODOLOGY_LINK_CLASS =
  "font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark";

/**
 * Coverage transparency — ALWAYS rendered. When everything is suppressed
 * this block (plus WhatThisMeasures) IS the report: publishing the honest
 * coverage state is the point, not a failure mode.
 */
function CoverageBlock({ edition }: Readonly<{ edition: TimeToSellEdition | null }>) {
  const published = edition?.coverage.districtsPublished ?? 0;
  const suppressed = edition?.coverage.districtsSuppressed ?? 0;
  return (
    <section
      aria-label="Coverage"
      className="rounded-2xl border border-border bg-muted p-6"
    >
      <p className="text-sm font-semibold text-neutral-900">
        {published.toLocaleString("en-GB")} district
        {published === 1 ? "" : "s"} published ·{" "}
        {suppressed.toLocaleString("en-GB")} below the disclosed sample
        threshold ({TIME_TO_SELL_MIN_PAIRS} matched sales/12 months)
      </p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        A district appears here only once we hold at least{" "}
        {TIME_TO_SELL_MIN_PAIRS} confirmed listing-to-completion matches for it
        in the trailing 12 months. Anything thinner stays suppressed — never
        estimated, never padded.
      </p>
    </section>
  );
}

/**
 * The honest all-suppressed state (today's production reality: 0 confirmed
 * matched pairs). Explains what the tracker measures, why it is harder to
 * game than portal figures, and exactly when districts will appear.
 */
function WhatThisMeasures({ matchedPairCount }: Readonly<{ matchedPairCount: number }>) {
  return (
    <>
      <section aria-labelledby="measures-heading">
        <h2 id="measures-heading" className="font-heading text-2xl font-bold text-neutral-900">
          No figure clears the disclosed threshold yet — here is the exact state
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Right now we hold{" "}
          <strong>
            {matchedPairCount.toLocaleString("en-GB")} confirmed matched sale
            {matchedPairCount === 1 ? "" : "s"}
          </strong>{" "}
          in the trailing 12 months — below the {TIME_TO_SELL_MIN_PAIRS}-match
          threshold every figure must clear before it publishes. So this
          edition publishes the coverage state instead of a number. That is
          deliberate: a tracker that pads thin samples into headlines would be
          exactly the kind of figure it exists to replace.
        </p>
      </section>

      <section aria-labelledby="honest-heading">
        <h2 id="honest-heading" className="font-heading text-2xl font-bold text-neutral-900">
          Why this number is harder to game than &lsquo;days to under offer&rsquo;
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Portals typically report time to &lsquo;sold subject to
          contract&rsquo; — a status an agent sets, that can be reset by
          relisting, and that says nothing about whether the sale actually
          completed. This tracker measures listing date to the{" "}
          <strong>Land Registry transfer date</strong> on the same property,
          using only confirmed Price Paid Data matches. Completion is a public
          record: it cannot be relisted away, backdated, or set optimistically.
          The numbers include conveyancing, so they will read longer than
          portal figures — because they measure the whole journey a seller
          actually lives through.
        </p>
      </section>

      <section aria-labelledby="when-heading">
        <h2 id="when-heading" className="font-heading text-2xl font-bold text-neutral-900">
          When districts will appear
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Each quarter the tracker recomputes every district from the confirmed
          matched pairs then available. The national median publishes first
          (once {TIME_TO_SELL_MIN_PAIRS} matches exist nationally), then each
          district automatically the quarter it clears the same threshold. No
          district is hand-picked and none is held back. The rules are already
          public:{" "}
          <Link href="/reports/time-to-sell/methodology" className={METHODOLOGY_LINK_CLASS}>
            read the methodology
          </Link>
          .
        </p>
      </section>
    </>
  );
}

function DistrictTable({ edition }: Readonly<{ edition: TimeToSellEdition }>) {
  return (
    <section aria-labelledby="districts-heading">
      <h2 id="districts-heading" className="font-heading text-2xl font-bold text-neutral-900">
        Fastest districts — listing to completion
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
        Ranked by median days from listing date to Land Registry transfer
        date, confirmed matched sales only. Sample sizes are shown because
        they are part of the claim.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-3 pr-4">
                Rank
              </th>
              <th scope="col" className="py-3 pr-4">
                District
              </th>
              <th scope="col" className="py-3 pr-4">
                Median days to complete
              </th>
              <th scope="col" className="py-3">
                Matched sales (n)
              </th>
            </tr>
          </thead>
          <tbody>
            {edition.districts.map((row, index) => (
              <tr key={row.areaId} className="border-b border-border">
                <td className="py-3 pr-4 font-semibold text-neutral-900">{index + 1}</td>
                <td className="py-3 pr-4 text-neutral-900">{row.areaName ?? row.areaId}</td>
                <td className="py-3 pr-4 font-semibold text-neutral-900">
                  {row.medianDays?.toLocaleString("en-GB")} days
                </td>
                <td className="py-3 text-neutral-600">{row.sampleN.toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function TimeToSellReportPage({ searchParams }: Props) {
  const { edition: editionParam } = await searchParams;
  const { edition, period, availablePeriods } = await getTimeToSellEdition(editionParam);

  const resolvedPeriod = edition?.period ?? period ?? editionParam ?? "";
  const national = edition?.national ?? null;

  const heroStat =
    national && national.visible && national.medianDays !== null
      ? {
          label: `National median, listing to completion — ${edition!.period}`,
          value: `${national.medianDays.toLocaleString("en-GB")} days`,
          caption: `Median across ${national.sampleN.toLocaleString("en-GB")} confirmed Land Registry matched sales in the trailing 12 months. Includes conveyancing — this is the full journey, not time to under offer.`,
        }
      : undefined;

  const hasDistricts = (edition?.districts.length ?? 0) > 0;
  const matchedPairCount = national?.sampleN ?? 0;

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
      <ReportShell
        eyebrow="TrueDeed reports"
        title={TITLE}
        strapline="Median days from listing to completion, measured on Land Registry-matched real sales — not portal 'time to under-offer' numbers. Published quarterly, suppressed below the disclosed sample threshold, never estimated."
        heroStat={heroStat}
        methodology={{
          sources: [
            {
              label: "HM Land Registry Price Paid Data (gov.uk)",
              url: HMLR_PPD_URL,
            },
            { label: "TrueDeed listing dates", url: "/search" },
          ],
          caveats: [
            "Completion = Land Registry transfer date, so figures include conveyancing and read longer than portal 'time to under offer' numbers — deliberately.",
            "Land Registry registrations lag completions by around 3 months, so the most recent sales are not yet in the data.",
            `Areas with fewer than ${TIME_TO_SELL_MIN_PAIRS} confirmed matched sales in the trailing 12 months are suppressed, never estimated.`,
          ],
          methodologyHref: "/reports/time-to-sell/methodology",
        }}
        shareTitle={`${TITLE} — days from listing to completion${resolvedPeriod ? `, ${resolvedPeriod}` : ""}`}
        shareToolKey="time_to_sell"
      >
        {edition && <ReportViewTracker report={`time_to_sell:${edition.period}`} />}

        {availablePeriods.length > 0 && (
          <EditionSwitcher
            editions={availablePeriods.map((p) => ({
              id: p,
              label: p,
              href: `/reports/time-to-sell?edition=${encodeURIComponent(p)}`,
              current: p === resolvedPeriod,
            }))}
          />
        )}

        <CoverageBlock edition={edition} />

        {hasDistricts && edition ? (
          <DistrictTable edition={edition} />
        ) : (
          <WhatThisMeasures matchedPairCount={matchedPairCount} />
        )}

        <section aria-label="Methodology">
          <p className="text-sm text-neutral-600">
            Every rule above — the matched-pair definition, the{" "}
            {TIME_TO_SELL_MIN_PAIRS}-match threshold, and the registration-lag
            caveat — is published in full:{" "}
            <Link href="/reports/time-to-sell/methodology" className={METHODOLOGY_LINK_CLASS}>
              read the full methodology
            </Link>
            .
          </p>
        </section>
      </ReportShell>
    </main>
  );
}
