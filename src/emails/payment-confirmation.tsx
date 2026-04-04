import { Section, Text } from "@react-email/components";
import type { PaymentConfirmationEmailProps } from "@/types/email";
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
  SUCCESS,
} from "@/emails/_constants/colors";

export function PaymentConfirmationEmail({
  firstName,
  amount,
  description,
  transactionId,
  paidAt,
  receiptUrl,
}: Readonly<PaymentConfirmationEmailProps>) {
  const formattedDate = new Date(paidAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Payment confirmed">
      <EmailHeader />

      <Section
        style={{
          backgroundColor: SUCCESS,
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
          &#10003; Payment Confirmed
        </Text>
      </Section>

      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: BRAND_PRIMARY,
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Payment Confirmed
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, we&apos;ve successfully processed your payment.
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
          <div style={{ marginBottom: "16px" }}>
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
                fontSize: "28px",
                fontWeight: "700",
                color: NEUTRAL_950,
                margin: "0",
                lineHeight: "1.2",
              }}
            >
              &pound;{amount.toLocaleString("en-GB")}
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
              Description
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: NEUTRAL_950,
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {description}
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
              Transaction ID
            </Text>
            <Text
              style={{
                fontSize: "13px",
                color: NEUTRAL_950,
                fontFamily: "ui-monospace, monospace",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {transactionId}
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
              Date
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: NEUTRAL_950,
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {formattedDate}
            </Text>
          </div>
        </div>

        {receiptUrl && (
          <EmailButton href={receiptUrl} variant="secondary">
            View Receipt
          </EmailButton>
        )}
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
