import type { Metadata } from "next";
import Link from "next/link";

import { ShareBar } from "@/components/trust/ShareBar";
import { ReportViewTracker } from "@/components/reports/ReportViewTracker";
import {
  TruthLeagueTable,
  type TruthLeagueTableEntry,
} from "@/components/reports/TruthLeagueTable";
import {
  formatGapPct,
  getRealityGapEdition,
} from "@/services/reports/reality-gap-service";

const TITLE = "Postcode Truth League";
const DESCRIPTION =
  "Every district ranked by how close asking prices sit to what buyers actually paid — smallest gap first. Built from HM Land Registry Price Paid Data and live TrueDeed listings; districts below the disclosed sample thresholds are counted, never ranked.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed reports`,
  description: DESCRIPTION,
  alternates: { canonical: "/reports/reality-gap/league" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/reports/reality-gap/league",
    images: [
      {
        url: `/api/og/report?title=${encodeURIComponent(TITLE)}`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
};

function leagueShareUrl(area: string, rank: number, gapPct: number | null): string {
  const params = new URLSearchParams({ area, rank: String(rank) });
  if (gapPct !== null) params.set("gapPct", String(gapPct));
  return `/api/og/league?${params.toString()}`;
}

type Props = Readonly<{ searchParams: Promise<{ edition?: string }> }>;

export default async function TruthLeaguePage({ searchParams }: Props) {
  const { edition: editionParam } = await searchParams;
  const { edition } = await getRealityGapEdition(editionParam);

  const entries: TruthLeagueTableEntry[] = (edition?.league ?? []).map((entry) => ({
    rank: entry.rank,
    district: entry.areaName ?? entry.areaId,
    gapLabel: entry.gapPct !== null ? formatGapPct(entry.gapPct) : "—",
    sampleAskingN: entry.sampleAskingN,
    sampleSoldN: entry.sampleSoldN,
    shareUrl: leagueShareUrl(
      entry.areaName ?? entry.areaId,
      entry.rank,
      entry.gapPct,
    ),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          TrueDeed reports
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          {TITLE}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
          A smaller gap means asking prices in that district sit closer to what
          buyers actually paid — rank 1 is the most honest market in the
          country{edition ? ` this edition (${edition.period})` : ""}. Rankings
          use area medians only, are computed for every district that clears
          the disclosed sample thresholds, and are never hand-picked.
        </p>
        <div className="mt-6">
          <ShareBar title={TITLE} toolKey="truth_league" />
        </div>
      </header>

      {edition ? (
        <>
          <ReportViewTracker report={`truth_league:${edition.period}`} />
          {entries.length > 0 ? (
            <TruthLeagueTable entries={entries} />
          ) : (
            <p className="text-sm text-neutral-600">
              No district clears the disclosed sample thresholds this quarter,
              so nothing is ranked — small-but-honest is the point.
            </p>
          )}
          {edition.suppressedDistrictCount > 0 && (
            <p className="mt-6 text-sm text-neutral-600">
              {edition.suppressedDistrictCount.toLocaleString("en-GB")} districts
              below sample threshold — not ranked.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-neutral-600">
          The league appears with the first published edition of the Reality
          Gap report — no edition has cleared the disclosed sample thresholds
          yet.
        </p>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-neutral-600">
        Derived from{" "}
        <Link
          href="/reports/reality-gap"
          className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
        >
          The Reality Gap
        </Link>{" "}
        — see the{" "}
        <Link
          href="/reports/reality-gap/methodology"
          className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
        >
          methodology
        </Link>{" "}
        for the exact thresholds and computation.
      </footer>
    </main>
  );
}
