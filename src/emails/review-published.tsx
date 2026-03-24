import { Section, Text } from "@react-email/components";
import type { ReviewPublishedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function ReviewPublishedEmail({
  recipientFirstName,
  reviewTitle,
  providerName,
  reviewUrl,
}: Readonly<ReviewPublishedEmailProps>) {
  return (
    <EmailWrapper previewText="Your review has been published">
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
          Your Review Has Been Published
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {recipientFirstName}, your review of{" "}
          <strong style={{ color: "#0A0A0B" }}>{providerName}</strong> titled
          &lsquo;{reviewTitle}&rsquo; has been published and is now visible to
          other users.
        </Text>

        <EmailButton href={reviewUrl} variant="primary">
          View Your Review
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
