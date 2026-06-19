"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, RefreshCw } from "lucide-react";
import type { AgentVendorReport } from "@/types/agent";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Listing = {
  id: string;
  title: string | null;
  address_line_1: string | null;
};

// --------------------------------------------------------------------------
// PDF download component — lazy-loads @react-pdf/renderer on click only
// --------------------------------------------------------------------------

type ReportData = Record<string, unknown>;

export function VendorReportDownload({
  reportData,
  agencyName,
}: Readonly<{
  reportData: ReportData;
  agencyName: string;
}>) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { pdf, Document, Page, Text, View, StyleSheet } = await import(
        "@react-pdf/renderer"
      );

      const styles = StyleSheet.create({
        page: {
          padding: 40,
          fontFamily: "Helvetica",
          fontSize: 11,
          color: "#1a1a1a",
        },
        header: {
          marginBottom: 24,
          borderBottomWidth: 2,
          borderBottomColor: "#2563eb",
          paddingBottom: 12,
        },
        title: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#2563eb",
          marginBottom: 4,
        },
        subtitle: { fontSize: 11, color: "#6b7280" },
        section: { marginTop: 16 },
        sectionTitle: {
          fontSize: 13,
          fontWeight: "bold",
          marginBottom: 8,
          color: "#111827",
        },
        row: {
          flexDirection: "row",
          marginBottom: 4,
          gap: 8,
        },
        label: { color: "#6b7280", width: 140 },
        value: { flex: 1 },
        footer: {
          position: "absolute",
          bottom: 30,
          left: 40,
          right: 40,
          fontSize: 9,
          color: "#9ca3af",
          textAlign: "center",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingTop: 8,
        },
      });

      const ReportDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.title}>Vendor Report</Text>
              <Text style={styles.subtitle}>{agencyName}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Summary</Text>
              {Object.entries(reportData).map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>{key.replace(/_/g, " ")}:</Text>
                  <Text style={styles.value}>
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value ?? "")}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.footer}>
              Generated {new Date().toLocaleDateString("en-GB")} — TrueDeed
              Vendor Report
            </Text>
          </Page>
        </Document>
      );

      const blob = await pdf(<ReportDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendor-report-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PDF",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <RefreshCw className="mr-2 size-3.5 animate-spin" />
      ) : (
        <Download className="mr-2 size-3.5" />
      )}
      Download PDF
    </Button>
  );
}

// --------------------------------------------------------------------------
// VendorReportList — main page client component
// --------------------------------------------------------------------------

export function VendorReportList({
  listings,
  reports: initialReports,
  userId,
}: Readonly<{
  listings: Listing[];
  reports: AgentVendorReport[];
  userId: string;
}>) {
  const [reports, setReports] = useState<AgentVendorReport[]>(initialReports);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Suppress unused variable warning — userId available for future use
  void userId;

  async function handleGenerate() {
    if (!selectedPropertyId) {
      toast.error("Please select a property first.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/agent/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedPropertyId,
          report_type: "listing_performance",
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to generate report");
      }

      const newReport = (await res.json()) as AgentVendorReport;
      setReports((prev) => [newReport, ...prev]);
      toast.success("Vendor report generated successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Generator panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Vendor Report</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Select Property
            </label>
            <Select
              value={selectedPropertyId}
              onValueChange={(v) => setSelectedPropertyId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a listing..." />
              </SelectTrigger>
              <SelectContent>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title ?? l.address_line_1 ?? l.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedPropertyId}
            className="shrink-0"
          >
            {generating ? (
              <RefreshCw className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Previous Reports
            <Badge variant="secondary" className="ml-2">
              {reports.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No reports generated yet.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize text-foreground">
                        {report.report_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Property: {report.property_id.substring(0, 8)}… &middot;{" "}
                      {new Date(report.generated_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <VendorReportDownload
                    reportData={(report.data as Record<string, unknown>) ?? {}}
                    agencyName="TrueDeed"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
