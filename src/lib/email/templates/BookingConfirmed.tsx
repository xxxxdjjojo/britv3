/**
 * Email template for booking confirmation notifications.
 * Sent immediately when a booking is confirmed.
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

type BookingConfirmedProps = Readonly<{
  recipientName: string;
  serviceName: string;
  dateTime: string;
  bookingUrl: string;
}>;

export default function BookingConfirmed({
  recipientName = "there",
  serviceName = "Service",
  dateTime = "",
  bookingUrl = "https://britestate.com/bookings",
}: BookingConfirmedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your booking for {serviceName} has been confirmed</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Britestate</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={mainText}>
              Your booking has been confirmed:
            </Text>
            <Section style={detailsBox}>
              <Text style={detailLabel}>Service</Text>
              <Text style={detailValue}>{serviceName}</Text>
              <Text style={detailLabel}>Date &amp; Time</Text>
              <Text style={detailValue}>{dateTime}</Text>
            </Section>
            <Button style={ctaButton} href={bookingUrl}>
              View Booking Details
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

const detailsBox = {
  backgroundColor: NEUTRAL_50,
  padding: "20px 24px",
  borderRadius: "6px",
  marginBottom: "24px",
};

const detailLabel = {
  fontSize: "12px",
  color: NEUTRAL_400,
  margin: "12px 0 2px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const detailValue = {
  fontSize: "16px",
  color: NEUTRAL_700,
  margin: "0",
  fontWeight: "600",
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
