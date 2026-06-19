import { Section, Text } from "@react-email/components";
import type { ReviewRemovedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { brandConfig } from "@/config/brand";

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
            color: "#1B4D3E",
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Your Review Has Been Removed
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
          &lsquo;{reviewTitle}&rsquo; has been removed by our moderation team.
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
              fontSize: "13px",
              color: "#9E9EAB",
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
              color: "#0A0A0B",
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
            color: "#5E5E6A",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          If you believe this is in error, please contact our support team at{" "}
          <a
            href={`mailto:${brandConfig.supportEmail}`}
            style={{ color: "#1B4D3E", textDecoration: "underline" }}
          >
            {brandConfig.supportEmail}
          </a>
          .
        </Text>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
