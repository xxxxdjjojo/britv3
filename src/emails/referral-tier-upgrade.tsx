import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

type Props = Readonly<{
  memberName: string;
  tierName: string;
  tierDescription: string;
  freeMonths: number;
  dashboardUrl: string;
}>;

export function ReferralTierUpgradeEmail({
  memberName,
  tierName,
  tierDescription,
  freeMonths,
  dashboardUrl,
}: Props) {
  return (
    <EmailWrapper previewText={`Congratulations — you've reached ${tierName} status!`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text style={{ fontSize: "24px", fontWeight: "700", color: "#1B4D3E", margin: "0 0 16px 0" }}>
          You&apos;ve reached {tierName} status!
        </Text>
        <Text style={{ fontSize: "15px", color: "#5E5E6A", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Congratulations {memberName}! Your referrals have earned you {tierName} tier.
        </Text>
        <div style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#92400E", margin: "0", lineHeight: "1.6" }}>
            {tierDescription}
          </Text>
          <Text style={{ fontSize: "13px", color: "#92400E", margin: "8px 0 0 0" }}>
            Total free months earned: {freeMonths}
          </Text>
        </div>
        <EmailButton href={dashboardUrl} variant="primary">
          View Your Tier
        </EmailButton>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
