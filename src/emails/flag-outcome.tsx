import { Section, Text } from "@react-email/components";
import type { FlagOutcomeEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_200,
} from "@/emails/_constants/colors";

export function FlagOutcomeEmail({
  recipientFirstName,
  outcome,
  reviewTitle,
}: Readonly<FlagOutcomeEmailProps>) {
  const isRemoved = outcome === "removed";

  return (
    <EmailWrapper previewText="Update on your review report">
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: BRAND_PRIMARY,
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Update on Your Review Report
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {recipientFirstName}, thank you for reporting a review. We have
          completed our investigation.
        </Text>

        <div
          style={{
            border: `1px solid ${NEUTRAL_200}`,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            backgroundColor: isRemoved ? "#FEF3F2" : "#F0FDF4",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: NEUTRAL_950,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            {isRemoved
              ? `The review '${reviewTitle}' you reported has been removed following our investigation.`
              : `We investigated the review '${reviewTitle}' you reported and determined it meets our community guidelines.`}
          </Text>
        </div>

        <Text
          style={{
            fontSize: "14px",
            color: NEUTRAL_600,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          If you have any further concerns, please contact our support team at{" "}
          <a
            href="mailto:support@britestate.co.uk"
            style={{ color: BRAND_PRIMARY, textDecoration: "underline" }}
          >
            support@britestate.co.uk
          </a>
          .
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
