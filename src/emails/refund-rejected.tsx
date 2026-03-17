import { Section, Text, Link } from "@react-email/components";
import type { RefundRejectedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";

export function RefundRejectedEmail({
  userName,
  chargeAmount,
  reason,
  adminNotes,
}: Readonly<RefundRejectedEmailProps>) {
  return (
    <EmailWrapper previewText="Refund request update">
      <EmailHeader />

      <Section
        style={{
          backgroundColor: "#F3F4F6",
          padding: "16px 32px",
          borderLeft: "4px solid #6B7280",
        }}
      >
        <Text
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#374151",
            margin: "0",
            lineHeight: "1.4",
          }}
        >
          Refund Request Update
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
          Refund request update
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {userName}, unfortunately your refund request could not be approved.
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
              Original Charge Amount
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
              {chargeAmount}
            </Text>
          </div>

          <div style={{ marginBottom: adminNotes ? "12px" : "0" }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#9E9EAB",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Reason
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: "#0A0A0B",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              {reason}
            </Text>
          </div>

          {adminNotes && (
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
                Additional Notes
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#0A0A0B",
                  margin: "0",
                  lineHeight: "1.4",
                }}
              >
                {adminNotes}
              </Text>
            </div>
          )}
        </div>

        <Text
          style={{
            fontSize: "14px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          If you have questions about this decision or believe it was made in
          error, please don&apos;t hesitate to reach out to our support team.
        </Text>

        <Text
          style={{
            fontSize: "13px",
            color: "#5E5E6A",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Need help?{" "}
          <Link
            href="https://britestate.co.uk/support"
            style={{
              color: "#2563EB",
              textDecoration: "none",
            }}
          >
            Contact our support team
          </Link>
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
