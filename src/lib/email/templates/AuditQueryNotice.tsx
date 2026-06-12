/**
 * Email template for Truedeed clause-10.2 audit queries.
 * Sent to the branch/agent when a PPD audit-mode match raises a buyer-identity
 * query (dispute playbook D3) — a question, never an invoice.
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

type AuditQueryNoticeProps = Readonly<{
  ppdAddress: string;
  completionDate: string;
  pricePaid: string;
  applicantName: string;
  firstContactDate: string;
  dashboardUrl: string;
  matchId: string;
}>;

export default function AuditQueryNotice({
  ppdAddress = "",
  completionDate = "",
  pricePaid = "",
  applicantName = "An applicant",
  firstContactDate = "",
  dashboardUrl = "https://britestate.co.uk/dashboard/agent/introductions",
  matchId = "",
}: AuditQueryNoticeProps) {
  return (
    <Html>
      <Head />
      <Preview>Buyer confirmation requested for {ppdAddress}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Britestate</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={title}>
              Buyer confirmation requested (clause 10.2)
            </Heading>
            <Text style={mainText}>
              PPD shows a completion at <strong>{ppdAddress}</strong> on{" "}
              <strong>{completionDate}</strong> at <strong>{pricePaid}</strong>;
              our records show introduced applicant{" "}
              <strong>{applicantName}</strong>, first contact{" "}
              <strong>{firstContactDate}</strong>.
            </Text>
            <Section style={detailBox}>
              <Text style={detailRow}>
                <strong>Completion (HM Land Registry PPD):</strong> {ppdAddress}
              </Text>
              <Text style={detailRow}>
                <strong>Transfer date:</strong> {completionDate}
              </Text>
              <Text style={detailRow}>
                <strong>Price paid:</strong> {pricePaid}
              </Text>
              <Text style={detailRow}>
                <strong>Introduced applicant:</strong> {applicantName}
              </Text>
              <Text style={detailRow}>
                <strong>First contact:</strong> {firstContactDate}
              </Text>
            </Section>
            <Text style={mainText}>
              Please confirm the buyer&apos;s identity within{" "}
              <strong>10 business days</strong> via your dashboard. If we do
              not hear from you the candidate proceeds to review with the
              silence noted.
            </Text>
            <Button style={ctaButton} href={dashboardUrl}>
              Confirm Buyer Identity
            </Button>
          </Section>
          <Text style={footer}>Audit query reference: {matchId}</Text>
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
