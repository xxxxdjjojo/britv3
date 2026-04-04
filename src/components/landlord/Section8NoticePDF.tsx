"use client";

/**
 * Section 8 Notice PDF component.
 * Renders a notice under Housing Act 1988 s.8 for tenancy agreement breach.
 * Must be imported with dynamic(ssr:false) due to @react-pdf/renderer SSR incompatibility.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

const SECTION_8_GROUNDS: Record<string, string> = {
  ground_8: "Ground 8 — Two or more months' rent arrears",
  ground_10: "Ground 10 — Some rent arrears (discretionary)",
  ground_11: "Ground 11 — Persistent delay in paying rent (discretionary)",
  ground_12: "Ground 12 — Breach of tenancy obligation (discretionary)",
  ground_13: "Ground 13 — Waste, neglect or deterioration of property (discretionary)",
  ground_14: "Ground 14 — Nuisance, annoyance, or illegal/immoral use (discretionary)",
  ground_15: "Ground 15 — Damage to furniture (discretionary)",
};

/* @react-pdf/renderer requires inline hex — these map to design system tokens */
const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#111827" /* neutral-900 */,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 24,
    color: "#374151" /* neutral-700 */,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    width: 200,
  },
  value: {
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB" /* neutral-300 */,
    marginVertical: 12,
  },
  groundRow: {
    marginBottom: 4,
    paddingLeft: 12,
  },
  footer: {
    marginTop: 32,
    fontSize: 9,
    color: "#6B7280" /* neutral-500 */,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB" /* neutral-300 */,
    paddingTop: 8,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#111827" /* neutral-900 */,
    marginTop: 24,
    marginBottom: 4,
    width: 240,
  },
});

type Section8PDFDocumentProps = Readonly<{
  tenantName: string;
  propertyAddress: string;
  landlordName: string;
  grounds: string[];
  arrearsAmount?: number;
  noticeDate: string;
}>;

function Section8PDFDocument({
  tenantName,
  propertyAddress,
  landlordName,
  grounds,
  arrearsAmount,
  noticeDate,
}: Section8PDFDocumentProps) {
  const hasGround8 = grounds.includes("ground_8");

  // Proceedings may begin 14 days after notice date for Ground 8
  const proceedingsDate = new Date(noticeDate);
  proceedingsDate.setDate(proceedingsDate.getDate() + 14);
  const proceedingsDateStr = proceedingsDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const noticeDateFormatted = new Date(noticeDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Notice Seeking Possession of a Property Let on an Assured Tenancy or
          Assured Shorthold Tenancy
        </Text>
        <Text style={styles.subtitle}>
          Housing Act 1988 Section 8
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>To (Tenant Name):</Text>
          <Text style={styles.value}>{tenantName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Of (Property Address):</Text>
          <Text style={styles.value}>{propertyAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Notice Date:</Text>
          <Text style={styles.value}>{noticeDateFormatted}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Grounds for Possession</Text>
        {grounds.map((ground) => (
          <View key={ground} style={styles.groundRow}>
            <Text>• {SECTION_8_GROUNDS[ground] ?? ground}</Text>
          </View>
        ))}

        {hasGround8 && arrearsAmount !== undefined && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Total Rent Arrears:</Text>
              <Text style={styles.value}>
                £{arrearsAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Proceedings may begin on or after:</Text>
          <Text style={styles.value}>{proceedingsDateStr}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Landlord</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{landlordName}</Text>
        </View>

        <View style={{ marginTop: 24 }}>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 9, color: "#6B7280" /* neutral-500 */ }}>Signature (Landlord/Agent)</Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Note: This form is for guidance only. Seek legal advice before
            issuing possession proceedings.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

type Section8NoticePDFDownloadProps = Section8PDFDocumentProps &
  Readonly<{ noticeId: string }>;

export function Section8NoticePDFDownload({
  noticeId,
  tenantName,
  propertyAddress,
  landlordName,
  grounds,
  arrearsAmount,
  noticeDate,
}: Section8NoticePDFDownloadProps) {
  return (
    <PDFDownloadLink
      document={
        <Section8PDFDocument
          tenantName={tenantName}
          propertyAddress={propertyAddress}
          landlordName={landlordName}
          grounds={grounds}
          arrearsAmount={arrearsAmount}
          noticeDate={noticeDate}
        />
      }
      fileName={`section8-notice-${noticeId}.pdf`}
      className="inline-flex items-center gap-2 rounded-md bg-warning px-4 py-2 text-sm font-medium text-white hover:bg-warning/90"
    >
      {({ loading }) => (loading ? "Preparing PDF..." : "Download Section 8 Notice (PDF)")}
    </PDFDownloadLink>
  );
}
