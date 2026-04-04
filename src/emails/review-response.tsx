import { Section, Text } from "@react-email/components";
import type { ReviewResponseEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_200,
  NEUTRAL_50,
} from "@/emails/_constants/colors";

export function ReviewResponseEmail({
  recipientFirstName,
  providerName,
  responsePreview,
  reviewUrl,
}: Readonly<ReviewResponseEmailProps>) {
  return (
    <EmailWrapper previewText={`${providerName} responded to your review`}>
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
          New Response to Your Review
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {recipientFirstName},{" "}
          <strong style={{ color: NEUTRAL_950 }}>{providerName}</strong> has
          responded to your review.
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
              fontSize: "14px",
              color: NEUTRAL_950,
              margin: "0",
              lineHeight: "1.6",
              fontStyle: "italic",
            }}
          >
            &ldquo;{responsePreview}&hellip;&rdquo;
          </Text>
        </div>

        <EmailButton href={reviewUrl} variant="primary">
          View Full Response
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
