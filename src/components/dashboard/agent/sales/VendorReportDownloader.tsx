"use client";

/**
 * Thin wrapper that provides PDFDownloadLink from @react-pdf/renderer.
 * This file is dynamically imported with ssr:false to prevent Turbopack
 * from tracing the @react-pdf/renderer module at build time.
 */

import { PDFDownloadLink } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = Readonly<{
  document: ReactElement<DocumentProps>;
  fileName: string;
}>;

export function VendorReportDownloader({ document, fileName }: Props) {
  return (
    <PDFDownloadLink document={document} fileName={fileName}>
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
