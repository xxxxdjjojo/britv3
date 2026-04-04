import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  NEUTRAL_950,
  NEUTRAL_600,
  SUCCESS,
  SUCCESS_LIGHT,
} from "@/emails/_constants/colors";

type Props = Readonly<{
  providerName: string;
  trustScore: number;
}>;

export function VerificationCompleteEmail({ providerName, trustScore }: Props) {
  return (
    <EmailWrapper previewText="You're now a Verified Professional on Britestate!">
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text style={{ fontSize: "24px", fontWeight: "700", color: BRAND_PRIMARY, margin: "0 0 16px 0", lineHeight: "1.3" }}>
          Congratulations, {providerName}!
        </Text>
        <Text style={{ fontSize: "15px", color: NEUTRAL_600, margin: "0 0 16px 0", lineHeight: "1.6" }}>
          You&apos;ve earned the <strong style={{ color: NEUTRAL_950 }}>Professional Verified</strong> badge on Britestate.
          Your trust score is now <strong style={{ color: SUCCESS }}>{trustScore}/100</strong>.
        </Text>
        <div style={{ backgroundColor: SUCCESS_LIGHT, border: "1px solid #86EFAC", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#15803D", margin: "0", lineHeight: "1.6" }}>
            Your profile is now visible in marketplace search and property recommendations. Homeowners can find and contact you directly.
          </Text>
        </div>
        <EmailButton href="https://britestate.co.uk/dashboard/provider" variant="primary">
          View Your Dashboard
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
