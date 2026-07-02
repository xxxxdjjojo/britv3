import type { Metadata } from "next";
import Link from "next/link";

import { ContentVersionStamp } from "@/components/trust/ContentVersionStamp";
import { MethodologyFooter } from "@/components/trust/MethodologyFooter";

const TITLE = "Reality Gap methodology";
const DESCRIPTION =
  "How TrueDeed computes the asking-vs-sold Reality Gap: data sources, the exact disclosed suppression thresholds, the two evidence tiers, and the no-cherry-picking rule.";

const HMLR_PPD_URL =
  "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";

/** Mirrors reality_gap_snapshots.methodology_version (currently 1). */
const METHODOLOGY_VERSION = 1;
const METHODOLOGY_CHECKED_DATE = "2 July 2026";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed reports`,
  description: DESCRIPTION,
  alternates: { canonical: "/reports/reality-gap/methodology" },
};

const SECTION_HEADING =
  "font-heading text-xl font-bold text-neutral-900";
const BODY = "mt-3 text-sm leading-relaxed text-neutral-600";

export default function RealityGapMethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          TrueDeed reports
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          {TITLE}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          Everything below is the complete recipe for{" "}
          <Link
            href="/reports/reality-gap"
            className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
          >
            The Reality Gap
          </Link>{" "}
          and the{" "}
          <Link
            href="/reports/reality-gap/league"
            className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
          >
            Postcode Truth League
          </Link>
          . If a figure is on those pages, this is exactly how it was made.
        </p>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="sources-heading">
          <h2 id="sources-heading" className={SECTION_HEADING}>
            Data sources
          </h2>
          <p className={BODY}>
            <strong>Sold prices:</strong>{" "}
            <a
              href={HMLR_PPD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
            >
              HM Land Registry Price Paid Data
            </a>{" "}
            (standard residential sales only, category A; deleted records
            excluded), trailing 12 months from the computation date.{" "}
            <strong>Asking prices:</strong> TrueDeed active and under-offer
            sale listings at the computation date. Both sides are medians —
            never means — so single outliers cannot move a figure.
          </p>
        </section>

        <section aria-labelledby="tiers-heading">
          <h2 id="tiers-heading" className={SECTION_HEADING}>
            The two evidence tiers — never blended
          </h2>
          <p className={BODY}>
            <strong>Matched pairs</strong> track the same property from listing
            to confirmed Land Registry completion. High confidence, small
            sample: the gap is measured on identical properties.{" "}
            <strong>Area medians</strong> compare the median asking price of
            what is for sale now against the median sold price of what
            completed in the trailing 12 months — two different populations,
            larger sample, cruder signal. Every published figure is labelled
            with its tier and the two are never combined into one number.
          </p>
        </section>

        <section aria-labelledby="thresholds-heading">
          <h2 id="thresholds-heading" className={SECTION_HEADING}>
            Suppression thresholds (disclosed, exact)
          </h2>
          <p className={BODY}>
            A cell publishes only when its sample clears these thresholds;
            otherwise it is suppressed and shown as suppressed — never
            estimated, interpolated, or padded:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>
              <strong>Area-median cells:</strong> at least{" "}
              <strong>20 asking prices</strong> AND at least{" "}
              <strong>100 sold transactions</strong>.
            </li>
            <li>
              <strong>Matched-pair cells:</strong> at least{" "}
              <strong>10 confirmed listing-to-sale pairs</strong>.
            </li>
          </ul>
          <p className={BODY}>
            Suppressed cells are also excluded from the Truth League rankings
            and from the CSV download.
          </p>
        </section>

        <section aria-labelledby="cherry-heading">
          <h2 id="cherry-heading" className={SECTION_HEADING}>
            The no-cherry-picking rule
          </h2>
          <p className={BODY}>
            Every computed cell that clears its threshold is published — none
            are hand-picked, and none are held back because they are
            unflattering to TrueDeed or to any area. The refresh recomputes
            every national and district cell in one pass; there is no editorial
            step between computation and publication.
          </p>
        </section>

        <section aria-labelledby="lag-heading">
          <h2 id="lag-heading" className={SECTION_HEADING}>
            Known lag: Land Registry registration
          </h2>
          <p className={BODY}>
            Completions typically take around 3 months to appear in Price Paid
            Data, so the sold side of each edition is missing the most recent
            sales. This biases nothing systematically, but it means a
            quarter&rsquo;s figures firm up over time — which is one reason each edition is
            recomputed rather than frozen on first publication.
          </p>
        </section>

        <section aria-labelledby="versioning-heading">
          <h2 id="versioning-heading" className={SECTION_HEADING}>
            Periods and versioning
          </h2>
          <p className={BODY}>
            Editions are quarterly, named <code>YYYY-Qn</code> (e.g.{" "}
            <code>2026-Q2</code>). Every published cell carries{" "}
            <code>methodology_version</code> (currently{" "}
            {METHODOLOGY_VERSION}); if the computation ever changes, the
            version increments and this page documents the change — figures
            computed under different versions are never mixed silently.
          </p>
        </section>
      </div>

      <footer className="mt-14 space-y-6 border-t border-border pt-8">
        <MethodologyFooter
          sources={[
            {
              label: "HM Land Registry Price Paid Data (gov.uk)",
              url: HMLR_PPD_URL,
            },
            { label: "TrueDeed active sale listings", url: "/search" },
          ]}
          caveats={[
            "Registrations lag completions by around 3 months.",
            "Area medians compare two different populations; matched pairs are small-n.",
            "Cells below the disclosed thresholds are suppressed, never estimated.",
          ]}
        />
        <ContentVersionStamp
          checkedDate={METHODOLOGY_CHECKED_DATE}
          version={METHODOLOGY_VERSION}
        />
      </footer>
    </main>
  );
}
