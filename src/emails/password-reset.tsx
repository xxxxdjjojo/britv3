import { Section, Text, Link } from "@react-email/components";
import type { PasswordResetEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function PasswordResetEmail({
  firstName,
  resetUrl,
  expiresInMinutes,
}: Readonly<PasswordResetEmailProps>) {
  const minutes = expiresInMinutes ?? 60;

  return (
    <EmailWrapper previewText="Reset your TrueDeed password">
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
          Reset your password
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName}, we received a request to reset the password for your TrueDeed account.
          Click the button below to choose a new password.
        </Text>

        <EmailButton href={resetUrl} variant="primary">
          Reset Password
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "24px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This link will expire in {minutes} minutes. If you did not request a password reset, you
          can safely ignore this email.
        </Text>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you&apos;re having trouble with the button, copy and paste this URL into your browser:
        </Text>
        <Link
          href={resetUrl}
          style={{
            fontSize: "12px",
            color: "#2563EB",
            wordBreak: "break-all",
            lineHeight: "1.6",
          }}
        >
          {resetUrl}
        </Link>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
