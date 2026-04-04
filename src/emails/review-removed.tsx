import { Section, Text } from "@react-email/components";
import type { ReviewRemovedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_400,
  NEUTRAL_200,
  NEUTRAL_50,
} from "@/emails/_constants/colors";

export function ReviewRemovedEmail({
  recipientFirstName,
  reviewTitle,
  providerName,
  reason,
}: Readonly<ReviewRemovedEmailProps>) {
  return (
    <EmailWrapper previewText="Your review has been removed">
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
          Your Review Has Been Removed
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {recipientFirstName}, your review of{" "}
          <strong style={{ color: NEUTRAL_950 }}>{providerName}</strong> titled
          &lsquo;{reviewTitle}&rsquo; has been removed by our moderation team.
        </Text>

        <div
          style={{
            border: `1px solid ${NEUTRAL_200}`,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            backgroundColor: NEUTRAL_50,
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              color: NEUTRAL_400,
              margin: "0 0 4px 0",
              lineHeight: "1.4",
              fontWeight: "600",
            }}
          >
            Reason
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: NEUTRAL_950,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            {reason}
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
          If you believe this is in error, please contact our support team at{" "}
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
