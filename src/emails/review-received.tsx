import { Section, Text } from "@react-email/components";
import type { ReviewReceivedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function ReviewReceivedEmail({
  recipientFirstName,
  reviewerName,
  rating,
  comment,
  propertyAddress,
  reviewUrl,
}: Readonly<ReviewReceivedEmailProps>) {
  const filledStars = Math.min(5, Math.max(0, Math.round(rating)));
  const emptyStars = 5 - filledStars;

  return (
    <EmailWrapper previewText="You've received a new review">
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
          New Review Received
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
          <strong style={{ color: "#0A0A0B" }}>{reviewerName}</strong> has left you a review.
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
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "24px", color: "#D4A853", letterSpacing: "2px" }}>
              {"★".repeat(filledStars)}
            </span>
            <span style={{ fontSize: "24px", color: "#9E9EAB", letterSpacing: "2px" }}>
              {"☆".repeat(emptyStars)}
            </span>
            <Text
              style={{
                fontSize: "13px",
                color: "#9E9EAB",
                margin: "4px 0 0 0",
                lineHeight: "1.4",
              }}
            >
              {rating} out of 5 stars
            </Text>
          </div>

          {comment && (
            <div
              style={{
                border: "1px solid #E2E2E8",
                borderRadius: "8px",
                padding: "12px 16px",
                backgroundColor: "#FFFFFF",
                marginBottom: "12px",
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
                &ldquo;{comment}&rdquo;
              </Text>
            </div>
          )}

          {propertyAddress && (
            <Text
              style={{
                fontSize: "13px",
                color: "#9E9EAB",
                margin: "0",
                lineHeight: "1.5",
              }}
            >
              For: {propertyAddress}
            </Text>
          )}
        </div>

        <EmailButton href={reviewUrl} variant="primary">
          View Review
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
