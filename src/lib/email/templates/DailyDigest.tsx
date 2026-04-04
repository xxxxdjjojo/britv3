/**
 * Email template for daily digest notifications.
 * Sent once per day with a summary of recent events.
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
  NEUTRAL_200,
  NEUTRAL_400,
  NEUTRAL_600,
  NEUTRAL_700,
} from "@/emails/_constants/colors";

type DigestEvent = Readonly<{
  title: string;
  description: string;
  url: string;
}>;

type DailyDigestProps = Readonly<{
  recipientName: string;
  events: DigestEvent[];
  dateRange: string;
}>;

export default function DailyDigest({
  recipientName = "there",
  events = [],
  dateRange = "today",
}: DailyDigestProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Your daily digest: ${String(events.length)} update${events.length === 1 ? "" : "s"} on Britestate`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Britestate</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={mainText}>
              Here is your daily summary for {dateRange}:
            </Text>
            {events.length === 0 ? (
              <Text style={emptyText}>No new updates today.</Text>
            ) : (
              events.map((event, i) => (
                <Section key={i} style={eventRow}>
                  <Text style={eventTitle}>{event.title}</Text>
                  <Text style={eventDescription}>{event.description}</Text>
                </Section>
              ))
            )}
            <Section style={ctaSection}>
              <Button
                style={ctaButton}
                href="https://britestate.com/notifications"
              >
                View All on Britestate
              </Button>
            </Section>
          </Section>
          <Text style={footer}>
            You received this digest because of your notification preferences on
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
  margin: "0 0 24px 0",
};

const emptyText = {
  fontSize: "14px",
  color: NEUTRAL_400,
  textAlign: "center" as const,
  padding: "24px 0",
};

const eventRow = {
  padding: "12px 0",
  borderBottom: `1px solid ${NEUTRAL_200}`,
};

const eventTitle = {
  fontSize: "14px",
  color: NEUTRAL_700,
  margin: "0 0 4px 0",
  fontWeight: "600",
};

const eventDescription = {
  fontSize: "13px",
  color: NEUTRAL_400,
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  marginTop: "24px",
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
