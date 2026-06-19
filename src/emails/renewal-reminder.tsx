import { Section, Text } from "@react-email/components";
import type { RenewalReminderEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

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
            color: "#1B4D3E",
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Subscription Renewal Reminder
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, your{" "}
          <strong style={{ color: "#0A0A0B" }}>{planName}</strong> subscription will automatically
          renew on <strong style={{ color: "#0A0A0B" }}>{formattedDate}</strong>.
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
              Plan
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
              {planName}
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
              Renewal Date
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
              Amount
            </Text>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#0A0A0B",
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
      <EmailFooter />
    </EmailWrapper>
  );
}
