import { Section, Text } from "@react-email/components";
import type { OfferReceivedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function OfferReceivedEmail({
  agentFirstName,
  propertyAddress,
  offerAmount,
  buyerName,
  submittedAt,
  dashboardUrl,
}: Readonly<OfferReceivedEmailProps>) {
  const formattedDate = new Date(submittedAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="You've received a new offer">
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
          New Offer Received
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {agentFirstName}, you&apos;ve received a new offer on{" "}
          <strong style={{ color: "#0A0A0B" }}>{propertyAddress}</strong>.
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
              fontSize: "12px",
              color: "#9E9EAB",
              margin: "0 0 4px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Offer Amount
          </Text>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#D4A853",
              margin: "0 0 20px 0",
              lineHeight: "1.2",
            }}
          >
            &pound;{offerAmount.toLocaleString("en-GB")}
          </Text>

          <div style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Buyer
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: "#0A0A0B",
                fontWeight: "500",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {buyerName}
            </Text>
          </div>

          <div>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Submitted
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: "#0A0A0B",
                fontWeight: "500",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {formattedDate}
            </Text>
          </div>
        </div>

        <EmailButton href={dashboardUrl} variant="primary">
          View Offer Details
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
