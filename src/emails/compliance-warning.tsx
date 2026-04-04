import { Section, Text } from "@react-email/components";
import type { ComplianceWarningEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  WARNING,
  WARNING_LIGHT,
  ERROR,
} from "@/emails/_constants/colors";

export function ComplianceWarningEmail({
  firstName,
  documentName,
  expiryDate,
  daysUntilExpiry,
  uploadUrl,
}: Readonly<ComplianceWarningEmailProps>) {
  const formattedDate = new Date(expiryDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isUrgent = daysUntilExpiry <= 7;

  return (
    <EmailWrapper previewText="Action required: Document expiring soon">
      <EmailHeader />

      <Section
        style={{
          backgroundColor: WARNING_LIGHT,
          borderLeft: `4px solid ${WARNING}`,
          padding: "16px 32px",
        }}
      >
        <Text
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#92400E",
            margin: "0",
            lineHeight: "1.4",
          }}
        >
          &#9888; Action Required
        </Text>
      </Section>

      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: BRAND_PRIMARY,
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Compliance Document Expiring Soon
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, your <strong style={{ color: NEUTRAL_950 }}>{documentName}</strong> is due
          to expire on <strong style={{ color: NEUTRAL_950 }}>{formattedDate}</strong> — that&apos;s{" "}
          <strong style={{ color: NEUTRAL_950 }}>{daysUntilExpiry} days</strong> from now.
        </Text>

        {isUrgent && (
          <Text
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: ERROR,
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            &#9888; Urgent: This document expires in {daysUntilExpiry} day
            {daysUntilExpiry === 1 ? "" : "s"}. Please upload your updated document immediately to
            avoid disruption to your account.
          </Text>
        )}

        <Text
          style={{
            fontSize: "14px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Please upload your updated document as soon as possible to maintain your compliance
          status and continue using Britestate services without interruption.
        </Text>

        <EmailButton href={uploadUrl} variant="primary">
          Upload Updated Document
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
