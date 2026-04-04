"use client";

/**
 * Section 21 Notice PDF component.
 * Renders a legally-structured notice under Housing Act 1988 s.21 + Deregulation Act 2015.
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
import type { LegalNotice } from "@/types/landlord";

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
    marginBottom: 2,
  },
  field: {
    marginBottom: 8,
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
  footer: {
    marginTop: 32,
    fontSize: 9,
    color: "#6B7280" /* neutral-500 */,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB" /* neutral-300 */,
    paddingTop: 8,
  },
  signatureBlock: {
    marginTop: 32,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#111827" /* neutral-900 */,
    marginTop: 24,
    marginBottom: 4,
    width: 240,
  },
});

type Section21PDFDocumentProps = Readonly<{
  notice: LegalNotice;
  tenantName: string;
  propertyAddress: string;
  landlordName: string;
  landlordAddress: string;
}>;

function Section21PDFDocument({
  notice,
  tenantName,
  propertyAddress,
  landlordName,
  landlordAddress,
}: Section21PDFDocumentProps) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const possessionDate = notice.possession_date
    ? new Date(notice.possession_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not specified";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Notice Requiring Possession of a Property Let on an Assured Shorthold
          Tenancy
        </Text>
        <Text style={styles.subtitle}>
          Housing Act 1988 Section 21(1)(b) or Section 21(4)(a)
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
          <Text style={styles.value}>{today}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Possession Date:</Text>
          <Text style={styles.value}>{possessionDate}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Landlord Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Landlord Name:</Text>
          <Text style={styles.value}>{landlordName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Landlord Address:</Text>
          <Text style={styles.value}>{landlordAddress}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Deposit Protection</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Scheme Reference:</Text>
          <Text style={styles.value}>
            {notice.deposit_scheme_reference ?? "N/A"}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Prerequisite Confirmations</Text>
        <View style={styles.row}>
          <Text style={styles.label}>EPC provided to tenant:</Text>
          <Text style={styles.value}>Yes</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>
            Gas Safety Certificate provided within 28 days of tenancy
            commencement:
          </Text>
          <Text style={styles.value}>Yes</Text>
        </View>

        <View style={styles.divider} />

        <Text>
          I/We give you notice requiring possession of the above-mentioned
          property. You are required to give up possession of the above property
          on or before the possession date stated above.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.sectionLabel}>Signature</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Landlord/Agent Name:</Text>
            <Text style={styles.value}>{landlordName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{today}</Text>
          </View>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 9, color: "#6B7280" /* neutral-500 */ }}>Signature</Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Note: This form is for guidance only. Seek legal advice to ensure
            compliance.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

type Section21NoticePDFDownloadProps = Section21PDFDocumentProps &
  Readonly<{ noticeId: string }>;

export function Section21NoticePDFDownload({
  notice,
  noticeId,
  tenantName,
  propertyAddress,
  landlordName,
  landlordAddress,
}: Section21NoticePDFDownloadProps) {
  return (
    <PDFDownloadLink
      document={
        <Section21PDFDocument
          notice={notice}
          tenantName={tenantName}
          propertyAddress={propertyAddress}
          landlordName={landlordName}
          landlordAddress={landlordAddress}
        />
      }
      fileName={`section21-notice-${noticeId}.pdf`}
      className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
    >
      {({ loading }) => (loading ? "Preparing PDF..." : "Download Section 21 Notice (PDF)")}
    </PDFDownloadLink>
  );
}
