import { Section, Text } from "@react-email/components";
import type { ViewingReminderEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function ViewingReminderEmail({
  firstName,
  propertyAddress,
  viewingDate,
  viewingTime,
  agentName,
  agentPhone,
  propertyUrl,
}: Readonly<ViewingReminderEmailProps>) {
  const formattedDate = new Date(viewingDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Reminder: You have a viewing today">
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          Viewing Reminder
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, just a reminder that you have a property viewing scheduled.
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
          <Text
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0A0A0B",
              margin: "0 0 16px 0",
              lineHeight: "1.3",
            }}
          >
            {propertyAddress}
          </Text>

          <div style={{ marginBottom: "10px" }}>
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
                fontSize: "14px",
                color: "#0A0A0B",
                fontWeight: "500",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {formattedDate}
            </Text>
          </div>

          <div style={{ marginBottom: "10px" }}>
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
                fontSize: "14px",
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
                fontSize: "14px",
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

        <EmailButton href={propertyUrl} variant="primary">
          View Property Details
        </EmailButton>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
