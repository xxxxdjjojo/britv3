import { Section, Text } from "@react-email/components";
import type { ViewingReminderEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_400,
  NEUTRAL_200,
  NEUTRAL_50,
} from "@/emails/_constants/colors";

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
            color: BRAND_PRIMARY,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          Viewing Reminder
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, just a reminder that you have a property viewing scheduled.
        </Text>

        <div
          style={{
            backgroundColor: NEUTRAL_50,
            border: `1px solid ${NEUTRAL_200}`,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <Text
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: NEUTRAL_950,
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
                color: NEUTRAL_400,
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
                color: NEUTRAL_950,
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
                color: NEUTRAL_400,
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
                color: NEUTRAL_950,
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
                color: NEUTRAL_400,
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
                color: NEUTRAL_950,
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
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
