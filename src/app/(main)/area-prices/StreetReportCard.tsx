"use client";

/**
 * StreetReportCard — a print-ready, date-stamped report card for one postcode,
 * built ONLY from real HM Land Registry Price Paid Data already loaded by the
 * explorer (medians, recent sales, sector trend). No estimates, no valuations,
 * no growth claims. Reuses RecentSalesList and TrendSparkline so the report
 * shows exactly what the page shows.
 *
 * Printing shows ONLY the card: the component ships a scoped @media print
 * stylesheet that hides everything outside #street-report-card.
 */

import { Download, Printer } from "lucide-react";
import { trackToolCompleted } from "@/lib/analytics/influence-events";
import type { RecentSale, SectorTrend } from "@/services/truedeed/ppd-postcode-service";
import { RecentSalesList } from "./RecentSalesList";
import { TrendSparkline } from "./TrendSparkline";

export const STREET_REPORT_CARD_ID = "street-report-card";

/**
 * Print isolation: hide the whole document, re-show only the report card and
 * pin it to the top of the page. Visibility (not display) keeps layout intact
 * so nested SVG/tables print exactly as rendered.
 */
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  #${STREET_REPORT_CARD_ID}, #${STREET_REPORT_CARD_ID} * { visibility: visible; }
  #${STREET_REPORT_CARD_ID} {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    margin: 0;
    box-shadow: none;
    border: none;
  }
}
`;

function formatPounds(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

function MedianFigure({ label, pounds }: Readonly<{ label: string; pounds: number }>) {
  return (
    <div className="flex flex-col">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-brand-primary">
        {label}
      </span>
      <span className="mt-1 font-heading text-2xl font-bold text-brand-primary-dark">
        {formatPounds(pounds)}
      </span>
    </div>
  );
}

export function StreetReportCard({
  postcode,
  areaName,
  flatMedianPounds,
  houseMedianPounds,
  recentSales,
  trend,
  generatedOn,
}: Readonly<{
  postcode: string;
  areaName?: string;
  flatMedianPounds?: number | null;
  houseMedianPounds?: number | null;
  recentSales: ReadonlyArray<RecentSale>;
  trend: SectorTrend;
  generatedOn: string;
}>) {
  return (
    <article
      id={STREET_REPORT_CARD_ID}
      aria-label={`Street report card for ${postcode}`}
      className="flex flex-col gap-5 rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)] sm:p-7"
    >
      <style>{PRINT_STYLES}</style>

      <header>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-brand-primary">
          TrueDeed · HM Land Registry sold prices
        </p>
        <h3 className="mt-1.5 font-heading text-2xl font-bold tracking-[-0.02em] text-brand-primary-dark">
          Street report card — {postcode}
        </h3>
        {areaName && (
          <p className="mt-1 font-sans text-sm text-brand-primary-dark/60">{areaName}</p>
        )}
        <p className="mt-1 font-sans text-xs text-brand-primary-dark/50">
          Generated {generatedOn}
        </p>
      </header>

      {(flatMedianPounds != null || houseMedianPounds != null) && (
        <div className="flex flex-wrap gap-10 border-y border-brand-primary/10 py-4">
          {flatMedianPounds != null && (
            <MedianFigure label="Flat · median sold" pounds={flatMedianPounds} />
          )}
          {houseMedianPounds != null && (
            <MedianFigure label="House · median sold" pounds={houseMedianPounds} />
          )}
        </div>
      )}

      {recentSales.length > 0 ? (
        <RecentSalesList postcode={postcode} sales={recentSales} />
      ) : (
        <p className="font-sans text-sm text-brand-primary-dark/60">
          No registered sales for {postcode} in the most recent Land Registry data.
        </p>
      )}

      <TrendSparkline trend={trend} />

      <footer className="border-t border-brand-primary/10 pt-3.5">
        <p className="font-sans text-xs leading-relaxed text-brand-primary-dark/50">
          Source: HM Land Registry Price Paid Data (Crown copyright). Sales appear ~3
          months after completion. Sold prices only — this is not a valuation.
        </p>
        <p className="mt-1 font-sans text-[0.7rem] text-brand-primary-dark/40">
          truedeed.co.uk/area-prices — free for anyone
        </p>
      </footer>
    </article>
  );
}

/**
 * Action row for the report card: print / save as PDF (window.print — the
 * @media print rules above isolate the card) and download the existing OG
 * share card PNG for this postcode. Hidden in print.
 */
export function StreetReportCardActions({
  postcode,
  areaName,
  flatMedianPounds,
  houseMedianPounds,
}: Readonly<{
  postcode: string;
  areaName?: string;
  flatMedianPounds?: number | null;
  houseMedianPounds?: number | null;
}>) {
  const ogParams = new URLSearchParams({ postcode });
  if (areaName) ogParams.set("area", areaName);
  if (flatMedianPounds != null) ogParams.set("flatMedian", String(flatMedianPounds));
  if (houseMedianPounds != null) ogParams.set("houseMedian", String(houseMedianPounds));
  const ogHref = `/api/og/postcode?${ogParams.toString()}`;

  function handlePrint() {
    trackToolCompleted("street_report_card", { action: "print" });
    window.print();
  }

  return (
    <div
      role="group"
      aria-label="Report card actions"
      className="flex flex-wrap items-center gap-2 print:hidden"
    >
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <Printer className="size-4" aria-hidden="true" />
        Print / save as PDF
      </button>
      <a
        href={ogHref}
        download={`street-report-card-${postcode.replace(/\s+/g, "-").toLowerCase()}.png`}
        onClick={() => trackToolCompleted("street_report_card", { action: "og_download" })}
        className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 font-sans text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <Download className="size-4" aria-hidden="true" />
        Download share card (PNG)
      </a>
    </div>
  );
}
