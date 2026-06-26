import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export type LifecycleDripEmailProps = Readonly<{
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
  previewText: string;
  unsubscribeUrl: string;
  firstName?: string;
}>;

/**
 * One generic lifecycle drip template shared by every role sequence and step.
 * Content is data-driven from LIFECYCLE_SEQUENCES — there is intentionally NO
 * bespoke per-step template. Brand deep-green, with a visible unsubscribe link
 * in the footer (PECR requirement for marketing email).
 */
export function LifecycleDripEmail({
  heading,
  paragraphs,
  ctaLabel,
  ctaHref,
  previewText,
  unsubscribeUrl,
  firstName,
}: LifecycleDripEmailProps) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  return (
    <EmailWrapper previewText={previewText}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "14px",
            color: "#5E5E6A",
            margin: "0 0 8px 0",
            lineHeight: "1.4",
          }}
        >
          {greeting}
        </Text>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 20px 0",
            lineHeight: "1.3",
          }}
        >
          {heading}
        </Text>
        {paragraphs.map((paragraph, index) => (
          <Text
            key={index}
            style={{
              fontSize: "15px",
              color: "#2E2E38",
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            {paragraph}
          </Text>
        ))}
        <Section style={{ marginTop: "24px" }}>
          <EmailButton href={ctaHref}>{ctaLabel}</EmailButton>
        </Section>
      </Section>
      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </EmailWrapper>
  );
}

export default LifecycleDripEmail;
