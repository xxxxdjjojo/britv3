/**
 * Email template for quote received notifications.
 * Sent immediately when a service provider sends a quote.
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
} from "@react-email/components";
import {
  BRAND_PRIMARY,
  NEUTRAL_50,
  NEUTRAL_400,
  NEUTRAL_600,
  NEUTRAL_700,
} from "@/emails/_constants/colors";

type QuoteReceivedProps = Readonly<{
  recipientName: string;
  providerName: string;
  quoteAmount: string;
  quoteUrl: string;
}>;

export default function QuoteReceived({
  recipientName = "there",
  providerName = "A service provider",
  quoteAmount = "",
  quoteUrl = "https://britestate.com/quotes",
}: QuoteReceivedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {providerName} sent you a quote for {quoteAmount} on Britestate
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Britestate</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={mainText}>
              <strong>{providerName}</strong> has sent you a quote:
            </Text>
            <Section style={quoteBox}>
              <Text style={amountLabel}>Quote Amount</Text>
              <Text style={amountValue}>{quoteAmount}</Text>
            </Section>
            <Button style={ctaButton} href={quoteUrl}>
              View Quote Details
            </Button>
          </Section>
          <Text style={footer}>
            You received this email because of your notification preferences on
            Britestate.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const body = {
  backgroundColor: NEUTRAL_50,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0",
  padding: "0",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const header = {
  backgroundColor: BRAND_PRIMARY,
  padding: "24px",
  borderRadius: "8px 8px 0 0",
};

const logoText = {
  color: "#ffffff",
  margin: "0",
  fontSize: "20px",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "32px",
  borderRadius: "0 0 8px 8px",
};

const greeting = {
  fontSize: "16px",
  color: NEUTRAL_700,
  margin: "0 0 16px 0",
};

const mainText = {
  fontSize: "14px",
  color: NEUTRAL_600,
  margin: "0 0 16px 0",
};

const quoteBox = {
  backgroundColor: NEUTRAL_50,
  padding: "24px",
  borderRadius: "6px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const amountLabel = {
  fontSize: "12px",
  color: NEUTRAL_400,
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const amountValue = {
  fontSize: "28px",
  color: BRAND_PRIMARY,
  margin: "0",
  fontWeight: "700",
};

const ctaButton = {
  display: "inline-block",
  backgroundColor: BRAND_PRIMARY,
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "500",
};

const footer = {
  textAlign: "center" as const,
  fontSize: "12px",
  color: NEUTRAL_400,
  marginTop: "16px",
};
