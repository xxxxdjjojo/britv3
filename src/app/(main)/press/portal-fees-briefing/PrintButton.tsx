"use client";

/**
 * PDF path decision: the downloadable PDF is delivered via a print stylesheet
 * plus `window.print()` ("Print / save as PDF"), following the
 * StreetReportCard precedent (src/app/(main)/area-prices/StreetReportCard.tsx)
 * — NOT @react-pdf/renderer. The print-CSS route ships zero extra bundle,
 * keeps the PDF pixel-identical to the reviewed page (one set of copy to
 * legally review, not two), and every browser's "Save as PDF" produces the
 * artefact journalists need.
 */

import { Printer } from "lucide-react";

import { trackToolCompleted } from "@/lib/analytics/influence-events";

export function PrintButton() {
  function handlePrint() {
    trackToolCompleted("portal_fees_briefing", { action: "print" });
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary print:hidden"
    >
      <Printer className="size-4" aria-hidden="true" />
      Print / save as PDF
    </button>
  );
}
