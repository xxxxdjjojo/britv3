import { Section, Text, Link } from "@react-email/components";
import type { ReferenceRequestEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function ReferenceRequestEmail({
  refereeName,
  providerName,
  providerTrade,
  referenceType,
  relationship,
  submissionUrl,
  expiresAt,
  isReminder,
}: Readonly<ReferenceRequestEmailProps>) {
  const name = refereeName || "there";
  const trader = providerTrade ? `${providerName} (${providerTrade})` : providerName;
  // A "client" reference is a customer vouch; a "peer" reference is a
  // fellow-professional vouch. Copy adapts so the referee understands which
  // relationship they are confirming.
  const relationshipWord = referenceType === "client" ? "customer" : "professional";
  const heading = isReminder
    ? `Reminder: ${providerName} needs your reference`
    : `${providerName} has asked you for a reference`;

  const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const previewText = isReminder
    ? `Reminder: give ${providerName} a reference before ${formattedExpiry}`
    : `${providerName} would like you to provide a reference`;

  return (
    <EmailWrapper previewText={previewText}>
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
          {heading}
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {name},
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          {isReminder ? "This is a reminder that " : ""}
          <strong>{trader}</strong> has asked you to provide a {relationshipWord}{" "}
          reference to support their verification on TrueDeed
          {relationship ? `, based on your relationship as ${relationship}` : ""}. It only
          takes a couple of minutes — click the button below to add your reference.
        </Text>

        <EmailButton href={submissionUrl} variant="primary">
          Provide your reference
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "24px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          This link is unique to you and expires on {formattedExpiry}. If you weren&apos;t
          expecting this, you can safely ignore this email.
        </Text>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "16px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you&apos;re having trouble with the button, copy and paste this URL into your
          browser:
        </Text>
        <Link
          href={submissionUrl}
          style={{
            fontSize: "12px",
            color: "#2563EB",
            wordBreak: "break-all",
            lineHeight: "1.6",
          }}
        >
          {submissionUrl}
        </Link>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
