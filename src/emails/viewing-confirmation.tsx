import { Section, Text } from "@react-email/components";
import type { ViewingConfirmationEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function ViewingConfirmationEmail({
  firstName,
  propertyAddress,
  viewingDate,
  viewingTime,
  agentName,
  agentPhone,
  propertyUrl,
  calendarUrl,
}: Readonly<ViewingConfirmationEmailProps>) {
  const formattedDate = new Date(viewingDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Your viewing is confirmed">
      <EmailHeader />

      <Section
        style={{
          backgroundColor: "#16A34A",
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
          &#10003; Viewing Confirmed
        </Text>
      </Section>

      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "0 0 4px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Property
        </Text>
        <Text
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#0A0A0B",
            margin: "0 0 24px 0",
            lineHeight: "1.3",
          }}
        >
          {propertyAddress}
        </Text>

        <Text
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#0A0A0B",
            margin: "0 0 16px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Viewing Details
        </Text>

        <div
          style={{
            backgroundColor: "#F8F8FA",
            border: "1px solid #E2E2E8",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
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
              Date
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
              Time
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
              {viewingTime}
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
              Agent
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
              {agentName}
              {agentPhone ? ` — ${agentPhone}` : ""}
            </Text>
          </div>
        </div>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "0 0 16px 0",
          }}
        >
          Hi {firstName}, we look forward to seeing you at your viewing.
        </Text>

        <div style={{ display: "inline-block", marginRight: "12px" }}>
          <EmailButton href={propertyUrl} variant="primary">
            View Property
          </EmailButton>
        </div>
        {calendarUrl && (
          <EmailButton href={calendarUrl} variant="secondary">
            Add to Calendar
          </EmailButton>
        )}
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
