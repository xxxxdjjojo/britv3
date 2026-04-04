/**
 * Email template for new message notifications.
 * Sent immediately when a user receives a new message.
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

type MessageNotificationProps = Readonly<{
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}>;

export default function MessageNotification({
  recipientName = "there",
  senderName = "Someone",
  messagePreview = "",
  conversationUrl = "https://britestate.com/messages",
}: MessageNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{senderName} sent you a message on Britestate</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Britestate</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={mainText}>
              <strong>{senderName}</strong> sent you a message:
            </Text>
            <Section style={messageBox}>
              <Text style={messageText}>
                &ldquo;{messagePreview}&rdquo;
              </Text>
            </Section>
            <Button style={ctaButton} href={conversationUrl}>
              View Conversation
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

const messageBox = {
  backgroundColor: NEUTRAL_50,
  padding: "16px",
  borderRadius: "6px",
  borderLeft: `4px solid ${BRAND_PRIMARY}`,
  marginBottom: "24px",
};

const messageText = {
  fontSize: "14px",
  color: NEUTRAL_700,
  margin: "0",
  fontStyle: "italic" as const,
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
