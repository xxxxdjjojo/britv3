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
  backgroundColor: "#f8f9fa",
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
  backgroundColor: "#1B4D3E",
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
  color: "#333333",
  margin: "0 0 16px 0",
};

const mainText = {
  fontSize: "14px",
  color: "#555555",
  margin: "0 0 16px 0",
};

const quoteBox = {
  backgroundColor: "#f0f4f3",
  padding: "24px",
  borderRadius: "6px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const amountLabel = {
  fontSize: "12px",
  color: "#888888",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const amountValue = {
  fontSize: "28px",
  color: "#1B4D3E",
  margin: "0",
  fontWeight: "700",
};

const ctaButton = {
  display: "inline-block",
  backgroundColor: "#1B4D3E",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "500",
};

const footer = {
  textAlign: "center" as const,
  fontSize: "12px",
  color: "#999999",
  marginTop: "16px",
};
