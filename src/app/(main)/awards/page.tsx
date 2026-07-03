import type { Metadata } from "next";
import Link from "next/link";

import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { ShareBar } from "@/components/trust/ShareBar";
import { createClient } from "@/lib/supabase/server";
import {
  AWARD_METRIC_LABELS,
  AWARD_MIN_SAMPLE,
  STALE_LISTING_DAYS,
} from "@/services/awards/award-scoring-service";
import { getAgencyAwardStanding } from "@/services/awards/award-standing-service";

import { AwardsOptInCta } from "./AwardsOptInCta";

const TITLE = "The Honest Agent Awards";
const DESCRIPTION =
  "The UK estate agency awards you cannot buy: winners are decided purely by transaction data — pricing accuracy, time to sell, listing hygiene. Free to enter, no votes, no sponsorship, ever.";

const HMLR_PPD_URL =
  "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads";

const OG_URL = `/api/og/report?title=${encodeURIComponent(TITLE)}&statLabel=${encodeURIComponent(
  "Decided by data. Never by votes. Never paid.",
)}`;

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/awards" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/awards",
    images: [{ url: OG_URL, width: 1200, height: 630, alt: TITLE }],
  },
};

const SECTION_HEADING = "font-heading text-xl font-bold text-neutral-900";
const BODY = "mt-3 text-sm leading-relaxed text-neutral-600";

const CRITERIA: ReadonlyArray<{ label: string; description: string }> = [
  {
    label: AWARD_METRIC_LABELS.pricing_accuracy,
    description:
      "How close an agency's final asking prices land to what buyers actually paid, measured on confirmed Land Registry completions of the same property. The smallest median gap wins.",
  },
  {
    label: AWARD_METRIC_LABELS.time_to_sell,
    description:
      "Median days from listing to legal completion, compared against the local median. Faster than the market — on real completions, not “under offer” dates — scores better.",
  },
  {
    label: AWARD_METRIC_LABELS.listing_hygiene,
    description:
      `The share of an agency's listings that go stale (active for more than ${STALE_LISTING_DAYS} days) or end withdrawn. A clean, honest book scores better than a padded one.`,
  },
];

export default async function AwardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const standing = user ? await getAgencyAwardStanding(supabase, user.id) : null;

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
          The estate agency awards nobody can buy. Winners are decided purely
          by what the transaction record shows — never by votes, never by
          sponsorship, and there is <strong>no pay-to-enter, ever</strong>.
          Nominations for the {new Date().getUTCFullYear()} awards are open
          now; results are announced in December.
        </p>
        <div className="mt-6">
          <ShareBar title={TITLE} toolKey="honest-agent-awards" />
        </div>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="why-heading">
          <h2 id="why-heading" className={SECTION_HEADING}>
            Why these awards exist
          </h2>
          <p className={BODY}>
            Most industry awards are marketing: entry fees, sponsored
            categories, judging panels, votes. None of that tells a seller
            which agency prices honestly and sells efficiently. These awards
            use the only evidence that cannot be bought — HM Land Registry
            completions matched to real listings — so a small independent
            agency can beat a national chain on merit alone.
          </p>
        </section>

        <section aria-labelledby="criteria-heading">
          <h2 id="criteria-heading" className={SECTION_HEADING}>
            The year-1 criteria
          </h2>
          <ul className="mt-4 space-y-4">
            {CRITERIA.map((criterion) => (
              <li
                key={criterion.label}
                className="rounded-lg border border-border bg-card p-4"
              >
                <h3 className="text-sm font-semibold text-neutral-900">
                  {criterion.label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {criterion.description}
                </p>
              </li>
            ))}
          </ul>
          <p className={BODY}>
            Every metric needs at least <strong>{AWARD_MIN_SAMPLE} qualifying
            observations</strong> before an agency can be ranked on it —
            agencies below that disclosed threshold are excluded, not guessed
            at. We do not publish live rankings during year 1 because matched
            transaction coverage is still building; the{" "}
            <Link
              href="/awards/methodology"
              className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
            >
              full methodology
            </Link>{" "}
            explains exactly how every score is computed, including the metric
            we dropped this year.
          </p>
        </section>

        <section aria-labelledby="rules-heading">
          <h2 id="rules-heading" className={SECTION_HEADING}>
            The rules that keep it honest
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600">
            <li>
              <strong>Free to enter, always.</strong> There is no entry fee,
              no sponsored category, and no paid placement — and there never
              will be.
            </li>
            <li>
              <strong>No votes.</strong> Popularity contests reward marketing
              budgets. Scores come from the transaction record only.
            </li>
            <li>
              <strong>Opt-in, not opt-out.</strong> An agency appears only if
              a member of its team opts it in, and can withdraw at any time.
            </li>
            <li>
              <strong>Disclosed suppression.</strong> Below{" "}
              {AWARD_MIN_SAMPLE} qualifying observations a metric is excluded
              and the agency is told why — never quietly padded.
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="nominate-heading"
          className="rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-6"
        >
          <h2 id="nominate-heading" className={SECTION_HEADING}>
            Nominate your agency
          </h2>
          <p className={BODY}>
            Opting in takes one click for any estate agency team member on
            TrueDeed. Your dashboard then shows your standing on every metric
            — or exactly how much more data you need before you can be ranked.
          </p>
          <div className="mt-5">
            <AwardsOptInCta initialOptedIn={standing?.optedIn ?? false} />
          </div>
        </section>

        <MethodologyFooter
          sources={[{ label: "HM Land Registry Price Paid Data", url: HMLR_PPD_URL }]}
          caveats={[
            "Land Registry completions are published with a lag of roughly three months, so recent sales are always under-counted.",
            `Metrics with fewer than ${AWARD_MIN_SAMPLE} qualifying observations are suppressed, not estimated.`,
            "The fall-through rate metric is dropped for year 1 — sale-progression coverage is too thin to score it honestly.",
          ]}
          methodologyHref="/awards/methodology"
        />
      </div>
    </main>
  );
}
