import { Section, Text, Link } from "@react-email/components";
import type { VerificationEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  BRAND_ACCENT,
  NEUTRAL_600,
  NEUTRAL_400,
} from "@/emails/_constants/colors";

export function VerificationEmail({
  firstName,
  verificationUrl,
  expiresInHours,
}: Readonly<VerificationEmailProps>) {
  const hours = expiresInHours ?? 24;

  return (
    <EmailWrapper previewText="Verify your email address to get started">
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
          Verify your email address
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, thank you for joining Britestate. To verify your account, click the
          button below.
        </Text>

        <EmailButton href={verificationUrl} variant="primary">
          Verify Email Address
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: NEUTRAL_400,
            margin: "24px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This link will expire in {hours} hours. If you did not create a Britestate account, you
          can safely ignore this email.
        </Text>

        <Text
          style={{
            fontSize: "13px",
            color: NEUTRAL_400,
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you&apos;re having trouble with the button, copy and paste this URL into your browser:
        </Text>
        <Link
          href={verificationUrl}
          style={{
            fontSize: "12px",
            color: BRAND_ACCENT,
            wordBreak: "break-all",
            lineHeight: "1.6",
          }}
        >
          {verificationUrl}
        </Link>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
