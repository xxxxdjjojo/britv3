"use client";

/**
 * PDF download button — this file is the ONLY module that imports from
 * @react-pdf/renderer at the module level. It must only be loaded via
 * dynamic(..., { ssr: false }) to avoid SSR bundling errors.
 */

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import VendorReportPDF from "./VendorReportPDF";
import type { AgentVendorReport } from "@/types/agent";

type PDFDownloadButtonProps = Readonly<{
  report: AgentVendorReport;
  fileName: string;
}>;

export default function PDFDownloadButton({
  report,
  fileName,
}: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<VendorReportPDF report={report} />}
      fileName={fileName}
    >
      {({ loading }: { loading: boolean }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Download PDF"
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
