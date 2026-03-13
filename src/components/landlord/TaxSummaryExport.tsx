"use client";

/**
 * TaxSummaryExport — client-only component.
 *
 * Provides two export functions:
 * 1. CSV download (pure client-side, no library needed)
 * 2. PDF download (via @react-pdf/renderer — loaded dynamically with ssr:false)
 *
 * IMPORTANT: This component uses @react-pdf/renderer which cannot run on the
 * server. It must always be loaded with dynamic(..., { ssr: false }).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import type { TaxSummary } from "@/types/landlord";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

// -- PDF styles ---------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#1B4D3E",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1B4D3E",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#555555",
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1B4D3E",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowLabel: {
    flex: 1,
    color: "#333333",
  },
  rowValue: {
    textAlign: "right",
    minWidth: 100,
    fontFamily: "Helvetica-Bold",
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#1B4D3E",
  },
  netLabel: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  netValue: {
    textAlign: "right",
    minWidth: 100,
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: "#1B4D3E",
  },
  disclaimer: {
    marginTop: 32,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  disclaimerText: {
    fontSize: 9,
    color: "#78350F",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#999999",
  },
});

// -- PDF Document component ---------------------------------------------------

function TaxSummaryDocument(
  props: Readonly<{
    summary: TaxSummary;
    taxYear: string;
    landlordName: string;
  }>,
) {
  const { summary, taxYear, landlordName } = props;

  const estimatedTax = summary.net > 0 ? summary.net * 0.2 : 0;

  return (
    <Document
      title={`Tax Summary ${taxYear}`}
      author={landlordName}
      subject="Property Tax Summary"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Property Tax Summary</Text>
          <Text style={styles.subtitle}>
            Tax Year: {taxYear} | Prepared for: {landlordName}
          </Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* Income summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Rental Income</Text>
            <Text style={styles.rowValue}>
              £{summary.income.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Expenses summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Allowable Expenses</Text>
            <Text style={styles.rowValue}>
              £{summary.expenses.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Net profit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Net Position</Text>
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>Net Profit / (Loss)</Text>
            <Text style={styles.netValue}>
              £{summary.net.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Estimated tax (informational only) */}
        {estimatedTax > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated Tax (Indicative Only)</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Basic Rate (20% of net profit)</Text>
              <Text style={styles.rowValue}>
                £{estimatedTax.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            IMPORTANT: This document is for reference purposes only and does not
            constitute tax advice. The estimated tax figure is based on the 20%
            basic rate and does not account for your personal allowance, higher
            rate thresholds, mortgage interest restrictions, or other deductions.
            Consult a qualified tax professional or accountant before filing your
            Self Assessment return with HMRC.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Britestate — Property Tax Summary
          </Text>
          <Text style={styles.footerText}>
            For self-assessment purposes only
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// -- Exported component -------------------------------------------------------

type Props = Readonly<{
  summary: TaxSummary;
  taxYear: string;
  landlordName: string;
}>;

export function TaxSummaryExport({ summary, taxYear, landlordName }: Props) {
  const [csvLoading, setCsvLoading] = useState(false);

  function handleCsvExport() {
    setCsvLoading(true);
    try {
      const csvRows: (string | number)[][] = [
        ["Category", "Amount (£)"],
        ["Tax Year", taxYear],
        ["", ""],
        ["Total Rental Income", summary.income.toFixed(2)],
        ["Total Expenses", summary.expenses.toFixed(2)],
        ["Net Profit", summary.net.toFixed(2)],
        ["", ""],
        ["Estimated Tax (basic rate 20%)", (summary.net > 0 ? summary.net * 0.2 : 0).toFixed(2)],
        ["", ""],
        [
          "Note: This is indicative only. Consult a tax professional before filing.",
          "",
        ],
      ];

      const csvContent = csvRows
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tax-summary-${taxYear.replace("/", "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setCsvLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* CSV export */}
      <Button
        variant="outline"
        onClick={handleCsvExport}
        disabled={csvLoading}
      >
        {csvLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Download CSV
      </Button>

      {/* PDF export — PDFDownloadLink handles async rendering */}
      <PDFDownloadLink
        document={
          <TaxSummaryDocument
            summary={summary}
            taxYear={taxYear}
            landlordName={landlordName}
          />
        }
        fileName={`tax-summary-${taxYear.replace("/", "-")}.pdf`}
      >
        {({ loading }) => (
          <Button variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {loading ? "Preparing PDF\u2026" : "Download PDF"}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
}
