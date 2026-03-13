"use client";

/**
 * TaxSummaryExportClient.tsx
 * Client wrapper for TaxSummaryExport so dynamic(ssr: false) is valid.
 * @react-pdf/renderer cannot run in a Server Component context.
 */

import dynamic from "next/dynamic";
import type { TaxSummary } from "@/types/landlord";

const TaxSummaryExportInner = dynamic(
  () =>
    import("@/components/landlord/TaxSummaryExport").then(
      (mod) => mod.TaxSummaryExport,
    ),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading export…</p> },
);

type Props = Readonly<{
  summary: TaxSummary;
  taxYear: string;
  landlordName: string;
}>;

export function TaxSummaryExportClient(props: Props) {
  return <TaxSummaryExportInner {...props} />;
}
