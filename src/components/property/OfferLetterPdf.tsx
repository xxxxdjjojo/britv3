"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    borderBottom: "2px solid #1a365d",
    paddingBottom: 15,
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    color: "#718096",
  },
  date: {
    marginBottom: 20,
    color: "#4a5568",
  },
  salutation: {
    marginBottom: 15,
  },
  paragraph: {
    marginBottom: 12,
  },
  offerAmount: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#ebf8ff",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 15,
    marginBottom: 8,
    color: "#2d3748",
  },
  keyTerms: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f7fafc",
    borderLeft: "3px solid #1a365d",
  },
  keyTermRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  keyTermLabel: {
    width: 180,
    fontFamily: "Helvetica-Bold",
    color: "#4a5568",
  },
  keyTermValue: {
    flex: 1,
    color: "#2d3748",
  },
  conditionItem: {
    marginBottom: 4,
    paddingLeft: 15,
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fffaf0",
    borderLeft: "3px solid #dd6b20",
    fontSize: 10,
    color: "#744210",
  },
  signatureBlock: {
    marginTop: 40,
  },
  signatureLine: {
    borderBottom: "1px solid #a0aec0",
    width: 200,
    marginTop: 40,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#718096",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#a0aec0",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 10,
  },
});

export type OfferLetterData = Readonly<{
  buyerName: string;
  buyerAddress: string;
  sellerName?: string;
  propertyAddress: string;
  offerAmount: number;
  conditions: string[];
  mortgageInPrinciple: boolean;
  chainFree: boolean;
  completionDate?: string;
  date: string;
}>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function OfferLetterPdf(props: Readonly<{ data: OfferLetterData }>) {
  const { data } = props;
  const recipientName = data.sellerName || "The Vendor";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>TrueDeed</Text>
          <Text style={styles.tagline}>
            Property Offer Letter
          </Text>
        </View>

        <Text style={styles.date}>{data.date}</Text>

        <Text style={styles.salutation}>Dear {recipientName},</Text>

        <Text style={styles.paragraph}>
          I am writing to formally submit an offer for the purchase of the
          property at the address detailed below. This offer is made in good
          faith and is subject to the terms and conditions outlined in this
          letter.
        </Text>

        <Text style={styles.sectionTitle}>Property</Text>
        <Text style={styles.paragraph}>{data.propertyAddress}</Text>

        <Text style={styles.sectionTitle}>Offer Amount</Text>
        <Text style={styles.offerAmount}>
          {formatCurrency(data.offerAmount)}
        </Text>

        <Text style={styles.sectionTitle}>Key Terms</Text>
        <View style={styles.keyTerms}>
          <View style={styles.keyTermRow}>
            <Text style={styles.keyTermLabel}>Mortgage in Principle:</Text>
            <Text style={styles.keyTermValue}>
              {data.mortgageInPrinciple ? "Yes" : "No"}
            </Text>
          </View>
          <View style={styles.keyTermRow}>
            <Text style={styles.keyTermLabel}>Chain Free:</Text>
            <Text style={styles.keyTermValue}>
              {data.chainFree ? "Yes" : "No"}
            </Text>
          </View>
          {data.completionDate && (
            <View style={styles.keyTermRow}>
              <Text style={styles.keyTermLabel}>Proposed Completion:</Text>
              <Text style={styles.keyTermValue}>{data.completionDate}</Text>
            </View>
          )}
        </View>

        {data.conditions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Conditions</Text>
            {data.conditions.map((condition, i) => (
              <Text key={i} style={styles.conditionItem}>
                {i + 1}. {condition}
              </Text>
            ))}
          </>
        )}

        <View style={styles.disclaimer}>
          <Text>
            This offer is subject to contract and survey. Nothing in this letter
            shall constitute a legally binding agreement. A formal contract will
            be prepared by the respective solicitors of both parties.
          </Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.paragraph}>Yours sincerely,</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{data.buyerName}</Text>
          <Text style={styles.signatureLabel}>{data.buyerAddress}</Text>
        </View>

        <Text style={styles.footer}>
          Generated via TrueDeed Property Portal
        </Text>
      </Page>
    </Document>
  );
}
