import { Section, Text, Link } from "@react-email/components";
import type { RefundRejectedEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import {
  BRAND_PRIMARY,
  BRAND_ACCENT,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_400,
  NEUTRAL_200,
  NEUTRAL_100,
  NEUTRAL_50,
  NEUTRAL_700,
} from "@/emails/_constants/colors";

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
          backgroundColor: NEUTRAL_100,
          padding: "16px 32px",
          borderLeft: `4px solid ${NEUTRAL_700}`,
        }}
      >
        <Text
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: NEUTRAL_700,
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
            color: BRAND_PRIMARY,
            margin: "0 0 16px 0",
            lineHeight: "1.3",
          }}
        >
          Refund request update
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {userName}, unfortunately your refund request could not be approved.
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
              Original Charge Amount
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
              {chargeAmount}
            </Text>
          </div>

          <div style={{ marginBottom: adminNotes ? "12px" : "0" }}>
            <Text
              style={{
                fontSize: "12px",
                color: NEUTRAL_400,
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
                color: NEUTRAL_950,
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
                  color: NEUTRAL_400,
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
                  color: NEUTRAL_950,
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
            color: NEUTRAL_600,
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
            color: NEUTRAL_600,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Need help?{" "}
          <Link
            href="https://britestate.co.uk/support"
            style={{
              color: BRAND_ACCENT,
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
