import { Section, Text, Link } from "@react-email/components";
import type { RefundConfirmedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { brandUrl } from "@/config/brand";

export function RefundConfirmedEmail({
  userName,
  refundAmount,
  chargeReference,
  refundDate,
}: Readonly<RefundConfirmedEmailProps>) {
  return (
    <EmailWrapper previewText="Your refund has been processed">
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
          &#10003; Refund Processed
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
          Your refund has been processed
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {userName}, we&apos;ve processed your refund. Here are the details:
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
          <div style={{ marginBottom: "16px" }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Refund Amount
            </Text>
            <Text
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0A0A0B",
                margin: "0",
                lineHeight: "1.2",
              }}
            >
              {refundAmount}
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
              Original Charge Reference
            </Text>
            <Text
              style={{
                fontSize: "13px",
                color: "#0A0A0B",
                fontFamily: "ui-monospace, monospace",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {chargeReference}
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
              Refund Date
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: "#0A0A0B",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {refundDate}
            </Text>
          </div>
        </div>

        <Text
          style={{
            fontSize: "14px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Funds will appear in your account within 5-10 business days, depending
          on your bank or card provider.
        </Text>

        <Text
          style={{
            fontSize: "13px",
            color: "#5E5E6A",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Have questions?{" "}
          <Link
            href={brandUrl("/support")}
            style={{
              color: "#2563EB",
              textDecoration: "none",
            }}
          >
            Contact our support team
          </Link>
        </Text>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
