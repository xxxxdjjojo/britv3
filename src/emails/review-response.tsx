import { Section, Text } from "@react-email/components";
import type { ReviewResponseEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

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
            color: "#1B4D3E",
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          New Response to Your Review
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {recipientFirstName},{" "}
          <strong style={{ color: "#0A0A0B" }}>{providerName}</strong> has
          responded to your review.
        </Text>

        <div
          style={{
            border: "1px solid #E2E2E8",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            backgroundColor: "#F8F8FA",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              color: "#0A0A0B",
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
