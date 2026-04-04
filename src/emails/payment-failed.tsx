import { Section, Text, Link } from "@react-email/components";
import type { PaymentFailedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  BRAND_ACCENT,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_400,
  ERROR,
  ERROR_LIGHT,
} from "@/emails/_constants/colors";

export function PaymentFailedEmail({
  firstName,
  amount,
  description,
  failedAt,
  retryUrl,
  supportUrl,
}: Readonly<PaymentFailedEmailProps>) {
  const formattedDate = new Date(failedAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Payment failed — action required">
      <EmailHeader />

      <Section
        style={{
          backgroundColor: ERROR_LIGHT,
          padding: "16px 32px",
          borderLeft: `4px solid ${ERROR}`,
        }}
      >
        <Text
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#991B1B",
            margin: "0",
            lineHeight: "1.4",
          }}
        >
          &#10007; Payment Failed
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
          There was a problem with your payment
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, we were unable to process your payment of{" "}
          <strong style={{ color: NEUTRAL_950 }}>
            &pound;{amount.toLocaleString("en-GB")}
          </strong>{" "}
          for <strong style={{ color: NEUTRAL_950 }}>{description}</strong>.
        </Text>

        <Text
          style={{
            fontSize: "14px",
            color: NEUTRAL_400,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Date attempted: {formattedDate}
        </Text>

        <EmailButton href={retryUrl} variant="primary">
          Retry Payment
        </EmailButton>

        {supportUrl && (
          <Text
            style={{
              fontSize: "13px",
              color: NEUTRAL_600,
              margin: "16px 0 0 0",
              lineHeight: "1.6",
            }}
          >
            Need help?{" "}
            <Link
              href={supportUrl}
              style={{
                color: BRAND_ACCENT,
                textDecoration: "none",
              }}
            >
              Contact our support team
            </Link>
          </Text>
        )}
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
