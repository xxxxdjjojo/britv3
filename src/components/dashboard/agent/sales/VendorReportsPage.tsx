"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORT_TYPES } from "@/types/agent";
import type { AgentVendorReport, ReportType } from "@/types/agent";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// Dynamic import — PDFDownloadButton is the only file that imports from
// @react-pdf/renderer at module level. Loading it with ssr:false prevents
// SSR bundling errors (Turbopack limitation with ESM-only packages).
// ============================================================================

const PDFDownloadButton = dynamic(
  () => import("./PDFDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="size-3 animate-spin" />
      </Button>
    ),
  },
);

// ============================================================================
// Types
// ============================================================================

type Listing = Readonly<{
  id: string;
  address_line_1: string;
  city: string | null;
}>;

type VendorReportsPageProps = Readonly<{
  listings: Listing[];
  initialReports: AgentVendorReport[];
}>;

// ============================================================================
// Badge configs
// ============================================================================

const REPORT_LABELS: Record<ReportType, string> = {
  listing_performance: "Listing Performance",
  viewing_summary: "Viewing Summary",
  market_analysis: "Market Analysis",
};

const REPORT_BADGE_CLASS: Record<ReportType, string> = {
  listing_performance: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  viewing_summary: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  market_analysis: "bg-success-light text-success dark:bg-success/20 dark:text-success",
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Component
// ============================================================================

export function VendorReportsPage({ listings, initialReports }: VendorReportsPageProps) {
  const [reports, setReports] = useState<AgentVendorReport[]>(initialReports);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("listing_performance");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!selectedPropertyId) {
      toast.error("Please select a property first");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/agent/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          reportType,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to generate report");
      }

      const newReport = (await res.json()) as AgentVendorReport;
      setReports((prev) => [newReport, ...prev]);
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Generator card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="size-4" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active listings found. Create a listing to generate vendor reports.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                {/* Property select */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1.5 block">
                    Property
                  </label>
                  <Select
                    value={selectedPropertyId}
                    onValueChange={(v) => setSelectedPropertyId(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property..." />
                    </SelectTrigger>
                    <SelectContent>
                      {listings.map((listing) => (
                        <SelectItem key={listing.id} value={listing.id}>
                          {listing.address_line_1}
                          {listing.city ? `, ${listing.city}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Report type select */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1.5 block">
                    Report Type
                  </label>
                  <Select
                    value={reportType}
                    onValueChange={(v) => setReportType(v as ReportType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {REPORT_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedPropertyId || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="size-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reports list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Generated Reports
          <span className="ml-2 text-sm text-muted-foreground font-normal">
            ({reports.length})
          </span>
        </h2>

        {reports.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No reports generated yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select a property above and click &quot;Generate Report&quot; to create your first report.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const listing = listings.find((l) => l.id === report.property_id);
              const propertyLabel = listing
                ? `${listing.address_line_1}${listing.city ? `, ${listing.city}` : ""}`
                : report.property_id.slice(0, 8) + "...";

              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 border rounded-lg p-4 bg-card"
                >
                  <FileText className="size-5 text-muted-foreground shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{propertyLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(report.generated_at)}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      REPORT_BADGE_CLASS[report.report_type]
                    }`}
                  >
                    {REPORT_LABELS[report.report_type]}
                  </span>

                  {/* PDF download — ssr:false to avoid bundling @react-pdf/renderer on server */}
                  <PDFDownloadButton
                    report={report}
                    fileName={`vendor-report-${report.id.slice(0, 8)}.pdf`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
