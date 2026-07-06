import type { Metadata } from "next";
import Link from "next/link";

import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { ShareBar } from "@/components/trust/ShareBar";
import {
  AWARD_METHODOLOGY_VERSION,
  AWARD_METRIC_LABELS,
  AWARD_MIN_SAMPLE,
  STALE_LISTING_DAYS,
} from "@/services/awards/award-scoring-service";

const TITLE = "Honest Agent Awards methodology";
const DESCRIPTION =
  "Exactly how Honest Agent Awards scores are computed: the three year-1 metrics, the disclosed minimum-sample rule, the metric we dropped, and every known caveat.";

const HMLR_PPD_URL =
  "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";

const OG_URL = `/api/og/report?title=${encodeURIComponent(TITLE)}`;

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/awards/methodology" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/awards/methodology",
    images: [{ url: OG_URL, width: 1200, height: 630, alt: TITLE }],
  },
};

const SECTION_HEADING = "font-heading text-xl font-bold text-neutral-900";
const BODY = "mt-3 text-sm leading-relaxed text-neutral-600";

export default function AwardsMethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          TrueDeed awards
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          {TITLE}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          This is the complete recipe for the{" "}
          <Link
            href="/awards"
            className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
          >
            Honest Agent Awards
          </Link>
          . If an agency is ever scored or ranked, this page is exactly how it
          was done — computation version {AWARD_METHODOLOGY_VERSION}. Scores
          come from the transaction record only: no votes, no judging panel,
          no fees.
        </p>
        <div className="mt-6">
          <ShareBar title={TITLE} toolKey="honest-agent-awards-methodology" />
        </div>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="sources-heading">
          <h2 id="sources-heading" className={SECTION_HEADING}>
            Data sources
          </h2>
          <p className={BODY}>
            <strong>Completions:</strong>{" "}
            <a
              href={HMLR_PPD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
            >
              HM Land Registry Price Paid Data
            </a>
            , matched to TrueDeed listings only where a listing-to-completion
            match is confirmed — never fuzzy-matched into a score.{" "}
            <strong>Listings:</strong> the agency&apos;s own TrueDeed listings.
            Every median is a median, never a mean, so one unusual sale cannot
            move a score.
          </p>
        </section>

        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className={SECTION_HEADING}>
            The three year-1 metrics (lower is better on all)
          </h2>
          <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>
              <strong>{AWARD_METRIC_LABELS.pricing_accuracy}:</strong> for each
              confirmed listing-to-completion pair in the award year, the
              absolute difference between the final asking price and the sold
              price, as a percentage of the sold price. An agency&apos;s score
              is the median across its pairs.
            </li>
            <li>
              <strong>{AWARD_METRIC_LABELS.time_to_sell}:</strong> the
              agency&apos;s median days from listing to legal completion,
              minus the local median from our published{" "}
              <Link
                href="/reports/time-to-sell"
                className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
              >
                Time-to-Sell dataset
              </Link>{" "}
              (the latest unsuppressed figure for the award year — national
              level at today&apos;s data volume). Negative means faster than
              the market. If no unsuppressed Time-to-Sell figure exists, no
              agency is ranked on this metric. Measured on completions only —
              “under offer” dates are never used.
            </li>
            <li>
              <strong>{AWARD_METRIC_LABELS.listing_hygiene}:</strong> of the
              agency&apos;s listings created in the trailing 12 months, the
              percentage that are withdrawn or stale (still active after{" "}
              {STALE_LISTING_DAYS} days).
            </li>
          </ul>
        </section>

        <section aria-labelledby="dropped-heading">
          <h2 id="dropped-heading" className={SECTION_HEADING}>
            The metric we dropped for year 1: fall-through rate
          </h2>
          <p className={BODY}>
            We wanted a fourth metric — the <strong>fall-through rate</strong>
            , the share of agreed sales that never reach completion. We are
            not scoring it in year 1, and here is the honest reason: our
            sale-progression records do not yet cover enough transactions to
            score any agency on it fairly (as of July 2026, effectively zero
            usable progression histories). Publishing a fall-through score
            from that would be fiction. It returns in year 2 if — and only if
            — progression coverage supports it, and this page will say so
            when it does.
          </p>
        </section>

        <section aria-labelledby="threshold-heading">
          <h2 id="threshold-heading" className={SECTION_HEADING}>
            The minimum-sample rule (disclosed, exact)
          </h2>
          <p className={BODY}>
            Every metric is computed for every opted-in agency, but an agency
            is ranked on a metric only when it has at least{" "}
            <strong>{AWARD_MIN_SAMPLE} qualifying observations</strong> for it
            ({AWARD_MIN_SAMPLE} confirmed matched sales for pricing accuracy
            and time to sell; {AWARD_MIN_SAMPLE} listings for listing
            hygiene). Below that the agency is <strong>excluded from the
            ranking</strong> and told exactly why on its own dashboard — the
            score is never estimated, interpolated, or padded. A median over
            fewer than {AWARD_MIN_SAMPLE} observations is too easy for one
            sale to swing, so we refuse to rank on it.
          </p>
        </section>

        <section aria-labelledby="never-heading">
          <h2 id="never-heading" className={SECTION_HEADING}>
            What can never affect a score
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>Votes, nominations volume, or any form of popularity input.</li>
            <li>
              Money — there is no entry fee, no sponsorship, and no paid
              placement anywhere in the awards.
            </li>
            <li>Advertising spend or any commercial relationship with TrueDeed.</li>
            <li>Opting in or out — participation changes visibility, never scores.</li>
          </ul>
        </section>

        <MethodologyFooter
          sources={[{ label: "HM Land Registry Price Paid Data", url: HMLR_PPD_URL }]}
          caveats={[
            "HM Land Registry publishes completions with a lag of roughly three months, so the most recent quarter is always under-counted — scores are computed after the lag has settled.",
            `Agencies with fewer than ${AWARD_MIN_SAMPLE} qualifying observations on a metric are excluded from that metric, not scored.`,
            "The fall-through rate metric is dropped for year 1 (sale-progression coverage is too thin to score honestly).",
            "Only listings linked to an agency organisation on TrueDeed can be scored; agencies not on TrueDeed are absent, not zero-scored.",
            `Computation version ${AWARD_METHODOLOGY_VERSION}. Any change to a metric definition increments this version and is documented here.`,
          ]}
        />
      </div>
    </main>
  );
}
