import { Section, Text } from "@react-email/components";
import type { ReferralInvitationEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function ReferralInvitationEmail({
  referrerName,
  recipientEmail,
  inviteUrl,
  rewardDescription,
}: Readonly<ReferralInvitationEmailProps>) {
  return (
    <EmailWrapper previewText={`${referrerName} has invited you to TrueDeed`}>
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
          You&apos;ve been invited to TrueDeed
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: "#0A0A0B" }}>{referrerName}</strong> thinks you&apos;d love
          TrueDeed &mdash; the UK&apos;s most trusted property portal.
        </Text>

        {rewardDescription && (
          <div
            style={{
              backgroundColor: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "24px",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#15803D",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              &#127381; Plus, {rewardDescription} when you sign up!
            </Text>
          </div>
        )}

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "0 0 24px 0",
            lineHeight: "1.5",
          }}
        >
          This invitation was sent to {recipientEmail}.
        </Text>

        <EmailButton href={inviteUrl} variant="primary">
          Accept Invitation
        </EmailButton>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
