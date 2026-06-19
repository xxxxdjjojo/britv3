import { Section, Text } from "@react-email/components";
import type { RentReminderEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function RentReminderEmail({
  tenantName,
  propertyAddress,
  rentAmount,
  rentFrequency,
  dueDate,
  payUrl,
}: Readonly<RentReminderEmailProps>) {
  const formattedDate = new Date(dueDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const frequencyLabel = rentFrequency === "weekly" ? "week" : "month";

  return (
    <EmailWrapper previewText="Your rent payment is due soon">
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
          Rent Payment Reminder
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {tenantName}, this is a reminder that your rent for{" "}
          <strong style={{ color: "#0A0A0B" }}>{propertyAddress}</strong> is due on{" "}
          <strong style={{ color: "#0A0A0B" }}>{formattedDate}</strong>.
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
              Property
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
              {propertyAddress}
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
              Due Date
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
              &pound;{rentAmount.toLocaleString("en-GB")} / {frequencyLabel}
            </Text>
          </div>
        </div>

        <EmailButton href={payUrl} variant="primary">
          View Rent Details
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
