"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AgentVendorReport, ReportType } from "@/types/agent";

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 48,
    color: "#111827",
  },
  // Letterhead
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2563EB",
    borderBottomStyle: "solid",
  },
  agencyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#2563EB",
  },
  agencyTagline: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
  },
  reportMeta: {
    alignItems: "flex-end",
  },
  reportMetaLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
  reportMetaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1E40AF",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
    borderBottomStyle: "solid",
  },

  // Key-value rows
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  rowLabel: {
    width: 160,
    color: "#6B7280",
    fontSize: 10,
  },
  rowValue: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },

  // Stat cards
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#F0F9FF",
    padding: 10,
    borderRadius: 4,
  },
  statCardLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 3,
  },
  statCardValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1D4ED8",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderTopStyle: "solid",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
});

// ============================================================================
// Helpers
// ============================================================================

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  listing_performance: "Listing Performance Report",
  viewing_summary: "Viewing Summary Report",
  market_analysis: "Market Analysis Report",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ============================================================================
// Component
// ============================================================================

type VendorReportPDFProps = Readonly<{
  report: AgentVendorReport;
  agencyName?: string;
}>;

export default function VendorReportPDF({
  report,
  agencyName = "Britestate Realty",
}: VendorReportPDFProps) {
  const data = report.data as Record<string, unknown>;
  const reportLabel = REPORT_TYPE_LABELS[report.report_type];

  return (
    <Document
      title={`${reportLabel} — ${formatDate(report.generated_at)}`}
      author={agencyName}
    >
      <Page size="A4" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          <View>
            <Text style={styles.agencyName}>{agencyName}</Text>
            <Text style={styles.agencyTagline}>Professional Property Services</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportMetaLabel}>Report Type</Text>
            <Text style={styles.reportMetaValue}>{reportLabel}</Text>
            <Text style={styles.reportMetaLabel}>Generated</Text>
            <Text style={styles.reportMetaValue}>
              {formatDate(report.generated_at)}
            </Text>
          </View>
        </View>

        {/* Property details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Property ID</Text>
            <Text style={styles.rowValue}>{report.property_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Report ID</Text>
            <Text style={styles.rowValue}>{report.id}</Text>
          </View>
        </View>

        {/* Performance data — listing_performance */}
        {report.report_type === "listing_performance" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Total Offers</Text>
                <Text style={styles.statCardValue}>
                  {String(data.total_offers ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Accepted Offers</Text>
                <Text style={styles.statCardValue}>
                  {String(data.accepted_offers ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Total Viewings</Text>
                <Text style={styles.statCardValue}>
                  {String(data.total_viewings ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Booked Viewings</Text>
                <Text style={styles.statCardValue}>
                  {String(data.booked_viewings ?? 0)}
                </Text>
              </View>
            </View>
            {data.highest_offer != null && (
              <View style={{ marginTop: 12, ...styles.row }}>
                <Text style={styles.rowLabel}>Highest Offer</Text>
                <Text style={styles.rowValue}>
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    minimumFractionDigits: 0,
                  }).format((data.highest_offer as number) / 100)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Viewing summary */}
        {report.report_type === "viewing_summary" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Viewing Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Total Slots</Text>
                <Text style={styles.statCardValue}>
                  {String(data.total_slots ?? 0)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardLabel}>Booked Slots</Text>
                <Text style={styles.statCardValue}>
                  {String(data.booked_slots ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Market analysis placeholder */}
        {report.report_type === "market_analysis" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Analysis</Text>
            <Text style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.6 }}>
              Market analysis data is generated from comparable properties in
              the same postcode district. Use the Market Appraisal tool in your
              dashboard to generate detailed comparable data, then re-run this
              report.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Confidential — Prepared for vendor use only
          </Text>
          <Text style={styles.footerText}>
            {agencyName} · Powered by Britestate
          </Text>
        </View>
      </Page>
    </Document>
  );
}
