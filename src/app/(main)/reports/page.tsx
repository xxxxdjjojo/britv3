import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "TrueDeed reports";
const DESCRIPTION =
  "Open data reports on the UK property market — asking vs sold price gaps, time to sell, and more. Every cell above the disclosed sample thresholds publishes automatically; none are hand-picked.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/reports" },
};

const LINK_CLASS =
  "font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark";

export default function ReportsIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          Open data
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          {TITLE}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
          We publish data we cannot cherry-pick. Each report recomputes every
          cell in one pass and publishes everything that clears its disclosed
          sample threshold — including the figures that flatter nobody. What
          falls below a threshold is suppressed and said to be suppressed,
          never estimated. The methodology, the thresholds and the raw CSVs
          are all public.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
            Live · quarterly
          </p>
          <h2 className="mt-2 font-heading text-xl font-bold text-neutral-900">
            The Reality Gap
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            What sellers ask versus what buyers actually paid — nationally, by
            property type, and district by district, from HM Land Registry
            Price Paid Data and live TrueDeed listings.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/reports/reality-gap" className={LINK_CLASS}>
                Read the latest edition
              </Link>
            </li>
            <li>
              <Link href="/reports/reality-gap/league" className={LINK_CLASS}>
                Postcode Truth League — every ranked district
              </Link>
            </li>
            <li>
              <Link href="/reports/reality-gap/methodology" className={LINK_CLASS}>
                Methodology and disclosed thresholds
              </Link>
            </li>
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            In the pipeline
          </p>
          <h2 className="mt-2 font-heading text-xl font-bold text-neutral-900">
            Time to Sell
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            How long listings really take from going live to Land Registry
            completion — measured on matched listing-to-sale pairs, not agent
            estimates. Arrives with matched-sale coverage: it publishes the
            quarter enough confirmed pairs clear the disclosed threshold,
            and not before.
          </p>
        </article>
      </div>
    </main>
  );
}
