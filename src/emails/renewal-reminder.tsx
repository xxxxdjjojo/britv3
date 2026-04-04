import { Section, Text } from "@react-email/components";
import type { RenewalReminderEmailProps } from "@/types/email";
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

export function RenewalReminderEmail({
  firstName,
  planName,
  renewalDate,
  amount,
  manageSubscriptionUrl,
}: Readonly<RenewalReminderEmailProps>) {
  const formattedDate = new Date(renewalDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Your subscription is renewing soon">
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
          Subscription Renewal Reminder
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, your{" "}
          <strong style={{ color: NEUTRAL_950 }}>{planName}</strong> subscription will automatically
          renew on <strong style={{ color: NEUTRAL_950 }}>{formattedDate}</strong>.
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
          <div style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: NEUTRAL_400,
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Plan
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: NEUTRAL_950,
                fontWeight: "500",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {planName}
            </Text>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: NEUTRAL_400,
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Renewal Date
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: NEUTRAL_950,
                fontWeight: "500",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {formattedDate}
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
              Amount
            </Text>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: NEUTRAL_950,
                margin: "0",
                lineHeight: "1.3",
              }}
            >
              &pound;{amount.toLocaleString("en-GB")} / month
            </Text>
          </div>
        </div>

        <EmailButton href={manageSubscriptionUrl} variant="secondary">
          Manage Subscription
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
