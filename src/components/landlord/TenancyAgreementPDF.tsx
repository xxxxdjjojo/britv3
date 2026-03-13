"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

import type { Tenancy } from "@/types/landlord";

// -- Styles -------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    color: "#666666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 14,
  },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#1B4D3E",
  },
  body: {
    fontSize: 10,
    color: "#333333",
  },
  clause: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  clauseTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  clauseBody: {
    fontSize: 10,
    color: "#444444",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  labelCol: {
    width: "35%",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#555555",
  },
  valueCol: {
    flex: 1,
    fontSize: 10,
    color: "#222222",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    marginVertical: 12,
  },
  signatureLine: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#999999",
    width: "60%",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 16,
  },
});

// -- Clauses ------------------------------------------------------------------

const CLAUSES = [
  {
    number: 1,
    title: "Payment of Rent",
    body: "The Tenant shall pay the Rent on the agreed date each month. Rent shall be paid by bank transfer unless otherwise agreed in writing.",
  },
  {
    number: 2,
    title: "Tenant Obligations",
    body: "The Tenant shall keep the Property in a clean and tidy condition, not cause or permit any damage, and use the Property only as a private residential dwelling.",
  },
  {
    number: 3,
    title: "Landlord Obligations",
    body: "The Landlord shall maintain the structure and exterior of the Property in good repair and ensure all gas, electrical, and fire safety compliance obligations are met.",
  },
  {
    number: 4,
    title: "Deposit",
    body: "The Deposit shall be held in a Government-approved tenancy deposit scheme. The Tenant will be provided with prescribed information within 30 days of receipt.",
  },
  {
    number: 5,
    title: "Repairs",
    body: "The Landlord shall be responsible for structural repairs and for keeping installations for the supply of water, gas, electricity, sanitation, heating, and hot water in proper working order.",
  },
  {
    number: 6,
    title: "Access",
    body: "The Landlord or authorised agents may enter the Property on giving at least 24 hours' written notice (except in an emergency) to carry out inspections or repairs.",
  },
  {
    number: 7,
    title: "Alterations",
    body: "The Tenant shall not make any alterations to the Property or install any fixtures without the prior written consent of the Landlord.",
  },
  {
    number: 8,
    title: "Sub-letting",
    body: "The Tenant shall not sub-let or part with possession of the whole or any part of the Property without the prior written consent of the Landlord.",
  },
  {
    number: 9,
    title: "Nuisance",
    body: "The Tenant shall not cause or permit any nuisance or annoyance to neighbouring occupiers or do anything that may affect the Landlord's insurance.",
  },
  {
    number: 10,
    title: "Termination",
    body: "Either party may terminate this Agreement on the expiry of the fixed term by giving the required notice period in writing. During the fixed term, the tenancy may only be ended as provided by the Housing Act 1988.",
  },
  {
    number: 11,
    title: "Governing Law",
    body: "This Agreement is governed by the law of England and Wales. Any dispute arising from this Agreement shall be subject to the exclusive jurisdiction of the English courts.",
  },
  {
    number: 12,
    title: "Energy Performance",
    body: "The Landlord has provided the Tenant with a current Energy Performance Certificate (EPC) for the Property prior to the commencement of this tenancy.",
  },
];

// -- Document -----------------------------------------------------------------

type TenancyAgreementDocProps = Readonly<{
  tenancy: Tenancy;
  landlordName: string;
  propertyAddress: string;
}>;

function TenancyAgreementDoc({ tenancy, landlordName, propertyAddress }: TenancyAgreementDocProps) {
  const rentDisplay = `£${tenancy.rent_amount.toLocaleString("en-GB")} per ${tenancy.rent_frequency}`;
  const depositDisplay = tenancy.deposit_amount
    ? `£${tenancy.deposit_amount.toLocaleString("en-GB")}`
    : "N/A";

  return (
    <Document
      title="Assured Shorthold Tenancy Agreement"
      author="Britestate"
      subject="Tenancy Agreement"
    >
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>Assured Shorthold Tenancy Agreement</Text>
        <Text style={styles.subtitle}>
          Prepared via Britestate — for guidance only; seek legal advice before signing
        </Text>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.heading}>1. The Parties</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Landlord:</Text>
            <Text style={styles.valueCol}>{landlordName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Tenant:</Text>
            <Text style={styles.valueCol}>{tenancy.tenant_name}</Text>
          </View>
          {tenancy.tenant_email && (
            <View style={styles.row}>
              <Text style={styles.labelCol}>Tenant Email:</Text>
              <Text style={styles.valueCol}>{tenancy.tenant_email}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Property */}
        <View style={styles.section}>
          <Text style={styles.heading}>2. The Property</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Address:</Text>
            <Text style={styles.valueCol}>{propertyAddress}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Tenancy period */}
        <View style={styles.section}>
          <Text style={styles.heading}>3. Tenancy Period</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Start Date:</Text>
            <Text style={styles.valueCol}>{tenancy.lease_start_date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>End Date:</Text>
            <Text style={styles.valueCol}>{tenancy.lease_end_date ?? "Periodic"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Financial terms */}
        <View style={styles.section}>
          <Text style={styles.heading}>4. Financial Terms</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Rent:</Text>
            <Text style={styles.valueCol}>{rentDisplay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Payment Method:</Text>
            <Text style={styles.valueCol}>Bank transfer</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Deposit:</Text>
            <Text style={styles.valueCol}>{depositDisplay}</Text>
          </View>
          {tenancy.deposit_scheme && (
            <View style={styles.row}>
              <Text style={styles.labelCol}>Deposit Scheme:</Text>
              <Text style={styles.valueCol}>{tenancy.deposit_scheme}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Clauses */}
        <View style={styles.section}>
          <Text style={styles.heading}>5. Terms and Conditions</Text>
          {CLAUSES.map((clause) => (
            <View key={clause.number} style={styles.clause}>
              <Text style={styles.clauseTitle}>
                {clause.number}. {clause.title}
              </Text>
              <Text style={styles.clauseBody}>{clause.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.heading}>6. Signatures</Text>
          <Text style={[styles.body, { marginBottom: 20 }]}>
            By signing below, both parties agree to be bound by the terms of this Agreement.
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Landlord Signature</Text>
              <Text style={styles.body}>{landlordName}</Text>
              <Text style={[styles.body, { color: "#888888", marginTop: 2 }]}>Date: ___________</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Tenant Signature</Text>
              <Text style={styles.body}>{tenancy.tenant_name}</Text>
              <Text style={[styles.body, { color: "#888888", marginTop: 2 }]}>Date: ___________</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// -- Download component -------------------------------------------------------

type TenancyAgreementPDFDownloadProps = Readonly<{
  tenancy: Tenancy;
  landlordName: string;
  propertyAddress: string;
}>;

export function TenancyAgreementPDFDownload({
  tenancy,
  landlordName,
  propertyAddress,
}: TenancyAgreementPDFDownloadProps) {
  const fileName = `tenancy-agreement-${tenancy.tenant_name.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <TenancyAgreementDoc
          tenancy={tenancy}
          landlordName={landlordName}
          propertyAddress={propertyAddress}
        />
      }
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white px-4 py-2 h-10"
      style={{ backgroundColor: "#1B4D3E" }}
    >
      {({ loading }) => (loading ? "Generating PDF..." : "Download Tenancy Agreement (PDF)")}
    </PDFDownloadLink>
  );
}
