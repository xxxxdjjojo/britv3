import { Section, Text } from "@react-email/components";
import type { ReferralInvitationEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_400,
  SUCCESS_LIGHT,
} from "@/emails/_constants/colors";

export function ReferralInvitationEmail({
  referrerName,
  recipientEmail,
  inviteUrl,
  rewardDescription,
}: Readonly<ReferralInvitationEmailProps>) {
  return (
    <EmailWrapper previewText={`${referrerName} has invited you to Britestate`}>
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
          You&apos;ve been invited to Britestate
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: NEUTRAL_950 }}>{referrerName}</strong> thinks you&apos;d love
          Britestate &mdash; the UK&apos;s most trusted property portal.
        </Text>

        {rewardDescription && (
          <div
            style={{
              backgroundColor: SUCCESS_LIGHT,
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
            color: NEUTRAL_400,
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
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
