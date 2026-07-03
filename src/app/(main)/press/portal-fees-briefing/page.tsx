import type { Metadata } from "next";
import Link from "next/link";

import { ReportViewTracker } from "@/components/reports/ReportViewTracker";
import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { SourcedFigure } from "@/components/trust/SourcedFigure";
import { formatGbpAmount } from "@/lib/format-money";
import {
  ALL_SOURCES,
  BRIEFING_DESCRIPTION,
  BRIEFING_PREPARED_DATE,
  BRIEFING_PREPARED_DATE_ISO,
  BRIEFING_SECTIONS,
  BRIEFING_TITLE,
  CAT_HEARING_DATES,
  CAT_HEARING_DATES_ISO,
  ESTIMATE_CAVEATS,
  PASSTHROUGH_ESTIMATES,
  PRESS_CONTACT,
  type BriefingFigure,
} from "@/content/portal-fees-briefing/briefing";
import { PrintButton } from "./PrintButton";

/**
 * Tribunal Data Pack (Influence Strategy 3.1, Campaign 30) — a journalist-
 * ready briefing on UK portal fees, live ahead of the Competition Appeal
 * Tribunal certification hearing (2–3 Nov 2026).
 *
 * Every figure renders through SourcedFigure (source required by type);
 * content lives in src/content/portal-fees-briefing/briefing.ts. The CAT
 * claim is ALLEGED, not proven — "the claim alleges" language throughout.
 * PDF path: print stylesheet + window.print() (see PrintButton.tsx for the
 * decision comment), not @react-pdf/renderer.
 */

const BRIEFING_ID = "portal-fees-briefing";

const OG_IMAGE_URL = `/api/og/report?title=${encodeURIComponent(
  BRIEFING_TITLE,
)}&stat=${encodeURIComponent("£308 → £1,621")}&statLabel=${encodeURIComponent(
  "Rightmove ARPA per month, 2009 → FY2025 (company-reported)",
)}`;

export const metadata: Metadata = {
  title: `${BRIEFING_TITLE} | TrueDeed press`,
  description: BRIEFING_DESCRIPTION,
  alternates: { canonical: "/press/portal-fees-briefing" },
  openGraph: {
    title: BRIEFING_TITLE,
    description: BRIEFING_DESCRIPTION,
    url: "/press/portal-fees-briefing",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: BRIEFING_TITLE }],
  },
};

/**
 * Print isolation (StreetReportCard precedent): hide the document, re-show
 * only the briefing article so "Save as PDF" yields a clean data pack.
 */
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  #${BRIEFING_ID}, #${BRIEFING_ID} * { visibility: visible; }
  #${BRIEFING_ID} {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
}
`;

function FigureCard({ figure }: Readonly<{ figure: BriefingFigure }>) {
  return (
    <div className="rounded-xl border border-brand-primary/10 bg-white p-4">
      <p className="font-heading text-xl font-bold text-brand-primary-dark">
        <SourcedFigure value={figure.display} source={figure.source} />
        {figure.alleged && (
          <span className="ml-2 align-middle rounded-full border border-neutral-300 px-2 py-0.5 text-[0.6rem] font-sans font-semibold uppercase tracking-wide text-neutral-600">
            Alleged, unproven
          </span>
        )}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{figure.label}</p>
      {figure.note && (
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{figure.note}</p>
      )}
    </div>
  );
}

function EstimateRow({
  display,
  label,
}: Readonly<{ display: string; label: string }>) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <p className="font-heading text-xl font-bold text-neutral-900">
        {display}
        <span className="ml-2 align-middle rounded-full bg-brand-primary/10 px-2 py-0.5 text-[0.6rem] font-sans font-semibold uppercase tracking-wide text-brand-primary">
          Estimate
        </span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{label}</p>
    </div>
  );
}

export default function PortalFeesBriefingPage() {
  const { annualPortalCostPerBranchPounds, portalCostPerListingPounds, inputs } =
    PASSTHROUGH_ESTIMATES;
  const commissionLowPct = (inputs.commissionRateLow.value * 100).toFixed(1);
  const commissionHighPct = (inputs.commissionRateHigh.value * 100).toFixed(1);

  return (
    <main>
      <ReportViewTracker report="portal_fees_briefing" />
      <article
        id={BRIEFING_ID}
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <style>{PRINT_STYLES}</style>

        <header className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
            TrueDeed press briefing · Tribunal data pack
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            {BRIEFING_TITLE}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
            {BRIEFING_DESCRIPTION}
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            Prepared{" "}
            <time dateTime={BRIEFING_PREPARED_DATE_ISO}>
              {BRIEFING_PREPARED_DATE}
            </time>
            , ahead of the Competition Appeal Tribunal certification hearing on{" "}
            <time dateTime={CAT_HEARING_DATES_ISO}>{CAT_HEARING_DATES}</time>.
            Free to quote with attribution to the linked primary sources.
          </p>
          <div className="mt-6">
            <PrintButton />
          </div>
        </header>

        <div className="space-y-12">
          {BRIEFING_SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2
                id={`${section.id}-heading`}
                className="font-heading text-2xl font-bold text-neutral-900"
              >
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600"
                >
                  {paragraph}
                </p>
              ))}
              {section.figures.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {section.figures.map((figure) => (
                    <FigureCard key={figure.id} figure={figure} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Passthrough estimates — computed, always labelled "Estimate". */}
          <section aria-labelledby="estimates-heading">
            <h2
              id="estimates-heading"
              className="font-heading text-2xl font-bold text-neutral-900"
            >
              What that could mean per sale — estimates
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">
              The figures below are arithmetic on the sourced FY2023 ARPA of{" "}
              <SourcedFigure
                value={formatGbpAmount(inputs.arpaMonthly.value)}
                source={inputs.arpaMonthly.source}
              />{" "}
              per branch per month, combined with one stated assumption:{" "}
              {inputs.listingsPerBranchMonthly.value} listings handled per
              branch per month, which is a TrueDeed assumption rather than a
              published statistic. They are estimates of the scale of the cost
              line, not findings about who ultimately bears it. For context,
              the HomeOwners Alliance puts typical sole-agency commission at{" "}
              <SourcedFigure
                value={`${commissionLowPct}%–${commissionHighPct}%`}
                source={inputs.commissionRateLow.source}
              />{" "}
              of the sale price including VAT.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <EstimateRow
                display={`${formatGbpAmount(annualPortalCostPerBranchPounds)} / branch / year`}
                label={`FY2023 ARPA annualised (${formatGbpAmount(inputs.arpaMonthly.value)} × 12)`}
              />
              <EstimateRow
                display={`≈ ${formatGbpAmount(portalCostPerListingPounds)} / listing`}
                label={`FY2023 ARPA ÷ ${inputs.listingsPerBranchMonthly.value} listings per branch per month (stated assumption)`}
              />
            </div>
            <ul className="mt-6 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-600">
              {ESTIMATE_CAVEATS.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </section>

          {/* Founder availability + press contact (mirrors /press). */}
          <section
            aria-labelledby="press-contact-heading"
            className="rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter p-8"
          >
            <h2
              id="press-contact-heading"
              className="font-heading text-2xl font-bold text-neutral-900"
            >
              {PRESS_CONTACT.heading}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">
              {PRESS_CONTACT.body}
            </p>
            <Link
              href={PRESS_CONTACT.contactHref}
              className="mt-4 inline-block rounded-full border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
            >
              {PRESS_CONTACT.contactLabel}
            </Link>
          </section>
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <MethodologyFooter
            sources={ALL_SOURCES}
            caveats={ESTIMATE_CAVEATS}
          />
        </div>
      </article>
    </main>
  );
}
