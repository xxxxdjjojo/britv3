"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  pdf,
} from "@react-pdf/renderer";

import type { ReactNode } from "react";
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
  disclaimer: {
    fontSize: 8,
    textAlign: "center",
    color: "#960000",
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
  subheading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 4,
  },
  body: {
    fontSize: 10,
    color: "#333333",
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
  obligation: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 3,
    paddingLeft: 15,
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

// -- Obligations --------------------------------------------------------------

const LANDLORD_OBLIGATIONS = [
  "Keep the structure and exterior of the Property in good repair.",
  "Keep installations for the supply of water, gas, electricity, sanitation, and heating in good repair and proper working order.",
  "Ensure the Property meets the Homes (Fitness for Human Habitation) Act 2018 requirements.",
  "Protect the Deposit in a government-approved tenancy deposit scheme within 30 days of receipt.",
  "Provide the Tenant with the prescribed information about the deposit scheme.",
  "Provide the Tenant with a copy of the How to Rent guide.",
  "Ensure valid gas safety, electrical safety, and Energy Performance certificates are in place.",
];

const TENANT_OBLIGATIONS = [
  "Pay the Rent on time and in the agreed manner.",
  "Keep the interior of the Property in a clean and reasonable condition.",
  "Not cause or permit any damage to the Property beyond reasonable wear and tear.",
  "Not make any alterations to the Property without the Landlord's prior written consent.",
  "Allow the Landlord reasonable access (with at least 24 hours' written notice) for inspections and repairs.",
  "Not assign, sublet, or part with possession of the Property without the Landlord's prior written consent.",
  "Comply with all applicable laws and regulations.",
];

// -- Document -----------------------------------------------------------------

export type LeaseAgreementDocProps = Readonly<{
  tenancy: Tenancy;
  propertyAddress: string;
  landlordName: string;
  customClauses?: string;
}>;

export function LeaseAgreementDoc({
  tenancy,
  propertyAddress,
  landlordName,
  customClauses,
}: LeaseAgreementDocProps) {
  const rentDisplay = `GBP ${tenancy.rent_amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })} per ${tenancy.rent_frequency === "monthly" ? "calendar month" : "week"}`;
  const depositDisplay = tenancy.deposit_amount
    ? `GBP ${tenancy.deposit_amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
    : "No deposit required.";

  return (
    <Document
      title="Assured Shorthold Tenancy Agreement"
      author="Britestate"
      subject="Lease Agreement"
    >
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>Assured Shorthold Tenancy Agreement</Text>
        <Text style={styles.disclaimer}>
          DISCLAIMER: This template is for guidance only. Seek legal advice before use.
        </Text>

        {/* Section 1: Parties */}
        <View style={styles.section}>
          <Text style={styles.heading}>1. PARTIES</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Landlord:</Text>
            <Text style={styles.valueCol}>{landlordName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Tenant:</Text>
            <Text style={styles.valueCol}>{tenancy.tenant_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Property:</Text>
            <Text style={styles.valueCol}>{propertyAddress}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 2: Term */}
        <View style={styles.section}>
          <Text style={styles.heading}>2. TERM</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Start Date:</Text>
            <Text style={styles.valueCol}>{tenancy.lease_start_date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>End Date:</Text>
            <Text style={styles.valueCol}>
              {tenancy.lease_end_date ?? "Periodic (rolling)"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 3: Rent */}
        <View style={styles.section}>
          <Text style={styles.heading}>3. RENT</Text>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Amount:</Text>
            <Text style={styles.valueCol}>{rentDisplay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCol}>Payment Method:</Text>
            <Text style={styles.valueCol}>Bank transfer or standing order</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Section 4: Deposit */}
        <View style={styles.section}>
          <Text style={styles.heading}>4. DEPOSIT</Text>
          {tenancy.deposit_amount ? (
            <>
              <View style={styles.row}>
                <Text style={styles.labelCol}>Amount:</Text>
                <Text style={styles.valueCol}>{depositDisplay}</Text>
              </View>
              {tenancy.deposit_scheme && (
                <View style={styles.row}>
                  <Text style={styles.labelCol}>Scheme:</Text>
                  <Text style={styles.valueCol}>{tenancy.deposit_scheme}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.body}>No deposit required.</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Section 5: Obligations */}
        <View style={styles.section}>
          <Text style={styles.heading}>5. OBLIGATIONS</Text>

          <Text style={styles.subheading}>{"Landlord's Obligations:"}</Text>
          {LANDLORD_OBLIGATIONS.map((obligation, i) => (
            <Text key={`lo-${i}`} style={styles.obligation}>
              {`\u2022 ${obligation}`}
            </Text>
          ))}

          <Text style={[styles.subheading, { marginTop: 8 }]}>
            {"Tenant's Obligations:"}
          </Text>
          {TENANT_OBLIGATIONS.map((obligation, i) => (
            <Text key={`to-${i}`} style={styles.obligation}>
              {`\u2022 ${obligation}`}
            </Text>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Section 6: Notices */}
        <View style={styles.section}>
          <Text style={styles.heading}>6. NOTICES</Text>
          <Text style={styles.body}>
            {"The Landlord must give at least two months' notice to end the tenancy (Section 21)."}
          </Text>
          <Text style={styles.body}>
            {"The Tenant must give at least one month's notice to end the tenancy."}
          </Text>
          <Text style={styles.body}>
            All notices must be in writing and served to the addresses stated in this agreement.
          </Text>
        </View>

        {/* Section 7: Additional Clauses (if provided) */}
        {customClauses?.trim() ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.heading}>7. ADDITIONAL CLAUSES</Text>
              <Text style={styles.body}>{customClauses}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.divider} />

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.heading}>SIGNATURES</Text>
          <Text style={[styles.body, { marginBottom: 20 }]}>
            By signing below, both parties agree to be bound by the terms of this Agreement.
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Landlord Signature</Text>
              <Text style={styles.body}>{landlordName}</Text>
              <Text style={[styles.body, { color: "#888888", marginTop: 2 }]}>
                Date: ___________
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Tenant Signature</Text>
              <Text style={styles.body}>{tenancy.tenant_name}</Text>
              <Text style={[styles.body, { color: "#888888", marginTop: 2 }]}>
                Date: ___________
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// -- Download component -------------------------------------------------------

type LeaseAgreementPDFDownloadProps = Readonly<{
  tenancy: Tenancy;
  propertyAddress: string;
  landlordName: string;
  customClauses?: string;
  children: (state: { loading: boolean }) => ReactNode;
  className?: string;
}>;

export function LeaseAgreementPDFDownload({
  tenancy,
  propertyAddress,
  landlordName,
  customClauses,
  children,
  className,
}: LeaseAgreementPDFDownloadProps) {
  const fileName = `lease-${tenancy.id}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <LeaseAgreementDoc
          tenancy={tenancy}
          propertyAddress={propertyAddress}
          landlordName={landlordName}
          customClauses={customClauses}
        />
      }
      fileName={fileName}
      className={className}
    >
      {({ loading }) => children({ loading })}
    </PDFDownloadLink>
  );
}

// -- Blob helper for programmatic use -----------------------------------------

export async function leaseAgreementToBlob(
  props: LeaseAgreementDocProps,
): Promise<Blob> {
  return pdf(<LeaseAgreementDoc {...props} />).toBlob();
}
