import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

type Props = Readonly<{
  referrerName: string;
  refereeName: string;
  creditAmount: string;
  dashboardUrl: string;
}>;

export function ReferralConvertedEmail({
  referrerName,
  refereeName,
  creditAmount,
  dashboardUrl,
}: Props) {
  return (
    <EmailWrapper previewText={`You earned ${creditAmount} — ${refereeName} just joined!`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text style={{ fontSize: "24px", fontWeight: "700", color: "#1B4D3E", margin: "0 0 16px 0" }}>
          You just earned {creditAmount} free!
        </Text>
        <Text style={{ fontSize: "15px", color: "#5E5E6A", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi {referrerName}, great news — <strong style={{ color: "#0A0A0B" }}>{refereeName}</strong>{" "}
          just activated their TrueDeed membership using your referral link.
        </Text>
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#15803D", margin: "0" }}>
            {creditAmount} subscription credit applied to your next invoice.
          </Text>
        </div>
        <Text style={{ fontSize: "13px", color: "#5E5E6A", margin: "0 0 24px 0", lineHeight: "1.5" }}>
          Keep sharing your referral link to earn more free months and unlock higher tiers!
        </Text>
        <EmailButton href={dashboardUrl} variant="primary">
          View Your Referrals
        </EmailButton>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
