import { Section, Text } from "@react-email/components";
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

type ReferenceRequestEmailProps = {
  providerName: string;
  refereeName: string;
  referenceType: "client" | "peer";
  submissionUrl: string;
  expiresInDays: number;
};

export function ReferenceRequestEmail({
  providerName,
  refereeName,
  referenceType,
  submissionUrl,
  expiresInDays,
}: Readonly<ReferenceRequestEmailProps>) {
  return (
    <EmailWrapper previewText={`Reference Request from ${providerName}`}>
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
          Reference Request from {providerName}
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: NEUTRAL_950 }}>{providerName}</strong> has
          requested a {referenceType} reference from you on Britestate &mdash;
          the UK&apos;s most trusted property portal.
        </Text>

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
            Your reference helps verify {providerName} as a trusted
            professional.
          </Text>
        </div>

        <Text
          style={{
            fontSize: "13px",
            color: NEUTRAL_400,
            margin: "0 0 24px 0",
            lineHeight: "1.5",
          }}
        >
          This link expires in {expiresInDays} days. Sent to you because{" "}
          {providerName} listed you as a reference.
        </Text>

        <EmailButton href={submissionUrl} variant="primary">
          Submit Your Reference
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
