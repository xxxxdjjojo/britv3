import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import { appUrl, brandConfig } from "@/config/brand";

type Props = Readonly<{
  blogUrl?: string;
}>;

export function NewsletterWelcomeEmail({ blogUrl }: Props) {
  const brandName = brandConfig.displayName;
  const ctaUrl = blogUrl ?? appUrl("/blog");

  return (
    <EmailWrapper previewText={`You're subscribed to ${brandName} property insights`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          You&apos;re subscribed
        </Text>
        <Text
          style={{
            fontSize: "16px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Thanks for subscribing to {brandName} property insights. We&apos;ll send
          you our latest guides, market analysis, and practical advice for buyers,
          renters, landlords, and sellers across the UK property market.
        </Text>

        <div
          style={{
            backgroundColor: "#F8F8FA",
            border: "1px solid #E2E2E8",
            borderRadius: "12px",
            padding: "24px",
            margin: "0 0 32px 0",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#1B4D3E",
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            What to expect
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            No spam, no daily noise — just considered, data-backed property
            insights delivered when they&apos;re worth reading.
          </Text>
        </div>

        <Text
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#0A0A0B",
            margin: "0 0 8px 0",
            lineHeight: "1.4",
          }}
        >
          Start reading now
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#5E5E6A",
            margin: "0 0 20px 0",
            lineHeight: "1.6",
          }}
        >
          Dive into our latest articles on the {brandName} blog while you wait for
          your first issue.
        </Text>

        <EmailButton href={ctaUrl} variant="primary">
          Read the blog
        </EmailButton>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
