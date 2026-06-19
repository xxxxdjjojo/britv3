import { Section, Text } from "@react-email/components";
import type { OfferStatusEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function OfferStatusEmail({
  firstName,
  propertyAddress,
  offerAmount,
  status,
  message,
  nextStepsUrl,
}: Readonly<OfferStatusEmailProps>) {
  const isAccepted = status === "accepted";
  const previewText = isAccepted ? "Your offer has been accepted!" : "Update on your offer";
  const heading = isAccepted
    ? "Congratulations! Your offer was accepted."
    : "We have an update on your offer.";

  return (
    <EmailWrapper previewText={previewText}>
      <EmailHeader />

      <Section
        style={{
          backgroundColor: isAccepted ? "#16A34A" : "#5E5E6A",
          padding: "16px 32px",
        }}
      >
        <Text
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#FFFFFF",
            margin: "0",
            lineHeight: "1.4",
          }}
        >
          {isAccepted ? "&#10003; Offer Accepted" : "Offer Update"}
        </Text>
      </Section>

      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          {heading}
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, your offer of{" "}
          <strong style={{ color: "#0A0A0B" }}>
            &pound;{offerAmount.toLocaleString("en-GB")}
          </strong>{" "}
          on <strong style={{ color: "#0A0A0B" }}>{propertyAddress}</strong> has been {status}.
        </Text>

        {message && (
          <div
            style={{
              borderLeft: "4px solid #E2E2E8",
              paddingLeft: "16px",
              marginBottom: "24px",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                color: "#5E5E6A",
                margin: "0",
                lineHeight: "1.6",
                fontStyle: "italic",
              }}
            >
              {message}
            </Text>
          </div>
        )}

        {nextStepsUrl && (
          <EmailButton href={nextStepsUrl} variant="primary">
            View Next Steps
          </EmailButton>
        )}
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
