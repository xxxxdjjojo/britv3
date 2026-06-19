/**
 * Email template for Truedeed introduction notifications (clause 3.1).
 * Sent to the branch/agent when an introduction is recorded on the ledger.
 * This email is dispute evidence — keep the content plain and factual.
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
import { appUrl, brandConfig } from "@/config/brand";

type IntroductionNotificationProps = Readonly<{
  applicantName: string;
  listingAddress: string;
  introducedAt: string;
  contactTypeLabel: string;
  rebuttalDeadline: string;
  dashboardUrl: string;
  introductionId: string;
}>;

export default function IntroductionNotification({
  applicantName = "An applicant",
  listingAddress = "",
  introducedAt = "",
  contactTypeLabel = "",
  rebuttalDeadline = "",
  dashboardUrl = appUrl("/dashboard/agent/introductions"),
  introductionId = "",
}: IntroductionNotificationProps) {
  const brandName = brandConfig.displayName;

  return (
    <Html>
      <Head />
      <Preview>New introduction recorded for {listingAddress}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>{brandName}</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={title}>
              New introduction recorded
            </Heading>
            <Text style={mainText}>
              An introduction has been recorded on the Truedeed ledger with the
              following details:
            </Text>
            <Section style={detailBox}>
              <Text style={detailRow}>
                <strong>Applicant:</strong> {applicantName}
              </Text>
              <Text style={detailRow}>
                <strong>Listing:</strong> {listingAddress}
              </Text>
              <Text style={detailRow}>
                <strong>Introduced at:</strong> {introducedAt}
              </Text>
              <Text style={detailRow}>
                <strong>First contact type:</strong> {contactTypeLabel}
              </Text>
            </Section>
            <Text style={mainText}>
              You have until <strong>{rebuttalDeadline}</strong> to dispute
              this introduction.
            </Text>
            <Button style={ctaButton} href={dashboardUrl}>
              View Introductions
            </Button>
          </Section>
          <Text style={footer}>
            Introduction reference: {introductionId}
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

const title = {
  fontSize: "18px",
  color: "#333333",
  margin: "0 0 16px 0",
};

const mainText = {
  fontSize: "14px",
  color: "#555555",
  margin: "0 0 16px 0",
};

const detailBox = {
  backgroundColor: "#f0f4f3",
  padding: "16px",
  borderRadius: "6px",
  borderLeft: "4px solid #1B4D3E",
  marginBottom: "24px",
};

const detailRow = {
  fontSize: "14px",
  color: "#333333",
  margin: "0 0 8px 0",
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
