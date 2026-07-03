import type { Metadata } from "next";
import Link from "next/link";

import { ContentVersionStamp } from "@/components/trust/ContentVersionStamp";
import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { TIME_TO_SELL_MIN_PAIRS } from "@/services/reports/time-to-sell-service";

const TITLE = "Time to Sell methodology";
const DESCRIPTION =
  "How TrueDeed measures days from listing to completion: data sources, the confirmed matched-pair definition, the disclosed 15-match suppression threshold, and the registration-lag caveat.";

const HMLR_PPD_URL =
  "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";

/** Mirrors time_to_sell_snapshots.methodology_version (currently 1). */
const METHODOLOGY_VERSION = 1;
const METHODOLOGY_CHECKED_DATE = "2 July 2026";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed reports`,
  description: DESCRIPTION,
  alternates: { canonical: "/reports/time-to-sell/methodology" },
};

const SECTION_HEADING = "font-heading text-xl font-bold text-neutral-900";
const BODY = "mt-3 text-sm leading-relaxed text-neutral-600";
const LINK_CLASS =
  "font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark";

export default function TimeToSellMethodologyPage() {
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
          Everything below is the complete recipe for the{" "}
          <Link href="/reports/time-to-sell" className={LINK_CLASS}>
            Time to Sell tracker
          </Link>
          . If a figure is on that page, this is exactly how it was made — and
          if no figure is there, this explains why not.
        </p>
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
              className={LINK_CLASS}
            >
              HM Land Registry Price Paid Data
            </a>{" "}
            transfer dates, trailing 12 months from the computation date.{" "}
            <strong>Listing dates:</strong> the date each property was first
            listed for sale on TrueDeed. Every figure is a median — never a
            mean — so single outliers cannot move it.
          </p>
        </section>

        <section aria-labelledby="pairs-heading">
          <h2 id="pairs-heading" className={SECTION_HEADING}>
            The matched-pair definition — confirmed matches only
          </h2>
          <p className={BODY}>
            One observation = one property we listed and then matched to its
            Land Registry sale, with the match <strong>confirmed</strong> —
            candidate or probable matches are never counted. Days to sell =
            Land Registry transfer date minus listing date. Because completion
            is the Land Registry <strong>transfer date</strong>, the number
            includes conveyancing: it is the honest end-to-end days a seller
            actually experiences, which is why our figures will typically read{" "}
            <strong>longer</strong> than portal &lsquo;time to under
            offer&rsquo; numbers. An under-offer status can be set
            optimistically, reset by relisting, and never checked against a
            completed sale; a transfer date is a public record.
          </p>
        </section>

        <section aria-labelledby="threshold-heading">
          <h2 id="threshold-heading" className={SECTION_HEADING}>
            Suppression threshold (disclosed, exact)
          </h2>
          <p className={BODY}>
            A figure publishes only when it is computed from at least{" "}
            <strong>{TIME_TO_SELL_MIN_PAIRS} confirmed matched sales</strong>{" "}
            in the trailing 12 months. Below that, the cell is suppressed and
            shown as suppressed — never estimated, interpolated, or padded.
            This applies identically to the national figure and to every
            district; suppressed districts are counted on the report page but
            never ranked. Every cell that clears the threshold is published —
            none are hand-picked and none are held back.
          </p>
        </section>

        <section aria-labelledby="lag-heading">
          <h2 id="lag-heading" className={SECTION_HEADING}>
            Known lag: Land Registry registration
          </h2>
          <p className={BODY}>
            Completions typically take around 3 months to appear in Price Paid
            Data, so each edition is missing the most recent sales and a
            quarter&rsquo;s figures firm up over time. Editions are recomputed
            rather than frozen on first publication for exactly this reason.
          </p>
        </section>

        <section aria-labelledby="versioning-heading">
          <h2 id="versioning-heading" className={SECTION_HEADING}>
            Periods and versioning
          </h2>
          <p className={BODY}>
            Editions are quarterly, named <code>YYYY-Qn</code> (e.g.{" "}
            <code>2026-Q2</code>). Every row carries{" "}
            <code>methodology_version</code> (currently {METHODOLOGY_VERSION});
            if the computation ever changes, the version increments and this
            page documents the change — figures computed under different
            versions are never mixed silently.
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
            { label: "TrueDeed listing dates", url: "/search" },
          ]}
          caveats={[
            "Completion = Land Registry transfer date — figures include conveyancing and read longer than portal numbers.",
            "Registrations lag completions by around 3 months.",
            `Cells below ${TIME_TO_SELL_MIN_PAIRS} confirmed matched sales are suppressed, never estimated.`,
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
