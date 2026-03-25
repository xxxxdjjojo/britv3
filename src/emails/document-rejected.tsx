import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

type DocumentRejectedEmailProps = Readonly<{
  providerName: string;
  documentType: string;
  rejectionReason: string;
  verificationUrl: string;
}>;

export function DocumentRejectedEmail({
  providerName,
  documentType,
  rejectionReason,
  verificationUrl,
}: DocumentRejectedEmailProps) {
  return (
    <EmailWrapper previewText={`Your ${documentType} was not approved`}>
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
          Document Not Approved
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {providerName}, your <strong style={{ color: "#0A0A0B" }}>{documentType}</strong> could
          not be verified.
        </Text>

        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#991B1B",
              margin: "0 0 4px 0",
            }}
          >
            Reason
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#B91C1C",
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            {rejectionReason}
          </Text>
        </div>

        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Please upload a new document to continue your verification.
        </Text>

        <EmailButton href={verificationUrl} variant="primary">
          Upload New Document
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "24px 0 0 0",
            lineHeight: "1.5",
          }}
        >
          If you believe this is an error, please contact support.
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
