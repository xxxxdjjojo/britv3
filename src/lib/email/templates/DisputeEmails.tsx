/**
 * Truedeed dispute email family — Phase 5.
 *
 *  - DisputeRaisedEmail     truedeed/dispute.raised (clause 9.5)
 *    Two variants:
 *      properly  = "this invoice is paused while we look into it"
 *      late      = "we'll consider this, but the dunning clock keeps running"
 *  - DisputeResolvedEmail   truedeed/dispute.resolved
 *      conceded  = "we agree — invoice cancelled"
 *      rejected  = "we don't agree — dunning resumes where it stopped"
 *  - ChargebackLetterEmail  truedeed/invoice.charged_back (annex)
 *      Ops-director letter: Guarantee right acknowledged; debt survives;
 *      material-breach framing; 10-business-day dispute channel; the Fraud
 *      Act 2006 sentence appears exactly once, as fact not threat.
 *
 * Tone: firm, specific, never apologetic, never hostile — same as the
 * billing family (spec §4). Every email names the exact next event/date.
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Link,
} from "@react-email/components";

// ---------------------------------------------------------------------------
// Shared styles (matched to InvoiceEmail.tsx so all Truedeed mail looks the same)
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
  margin: "0",
};

const link = {
  color: "#1B4D3E",
  textDecoration: "underline",
};

const footer = {
  textAlign: "center" as const,
  fontSize: "12px",
  color: "#999999",
  marginTop: "16px",
};

// ---------------------------------------------------------------------------
// DisputeRaisedEmail — clause 9.5 confirmation
// ---------------------------------------------------------------------------

export type DisputeRaisedEmailProps = Readonly<{
  invoiceNo: string;
  firstName: string;
  propertyAddress: string;
  /** True iff inside the 10-business-day clause 9.5 window. */
  properlyRaised: boolean;
  /** ISO date when the dunning would resume / has resumed. */
  windowEndDate: string;
  dashboardLink: string;
}>;

export function DisputeRaisedEmail({
  invoiceNo,
  firstName,
  propertyAddress,
  properlyRaised,
  windowEndDate,
  dashboardLink,
}: DisputeRaisedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {properlyRaised
          ? `Dispute received — invoice ${invoiceNo} paused while we look into it`
          : `Dispute received — invoice ${invoiceNo} (late, dunning continues)`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Truedeed Accounts</Heading>
          </Section>
          <Section style={content}>
            <Heading style={title}>
              {properlyRaised
                ? `We've paused invoice ${invoiceNo} while we look into it`
                : `Dispute received for invoice ${invoiceNo}`}
            </Heading>
            <Text style={mainText}>Hi {firstName},</Text>
            <Text style={mainText}>
              We&apos;ve received your dispute for invoice {invoiceNo} (completion at{" "}
              {propertyAddress}).
            </Text>

            {properlyRaised ? (
              <Section style={detailBox}>
                <Text style={detailRow}>
                  Because the dispute was raised inside the 10 business-day
                  window (clause 9.5), the dunning clock on this invoice is
                  paused while we resolve it. Other invoices keep their own
                  clocks. We&apos;ll be in touch with the decision; resolution
                  restarts the clock where it stopped.
                </Text>
              </Section>
            ) : (
              <Section style={detailBox}>
                <Text style={detailRow}>
                  The dispute was raised after the 10 business-day window
                  (clause 9.5), so the dunning clock on this invoice continues
                  to run. We&apos;ll still consider your grounds on the merits and
                  come back to you — but please do not assume the dunning state
                  has paused.
                </Text>
              </Section>
            )}

            <Text style={mainText}>
              You can review the dispute and any evidence here:{" "}
              <Link href={dashboardLink} style={link}>
                {dashboardLink}
              </Link>
            </Text>
            <Text style={mainText}>
              Reference date for the window: {windowEndDate}.
            </Text>
          </Section>
          <Text style={footer}>
            Truedeed — completion-only network fees, evidence-grade attribution.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function disputeRaisedSubject(props: DisputeRaisedEmailProps): string {
  return props.properlyRaised
    ? `Dispute received — invoice ${props.invoiceNo} paused while we look into it`
    : `Dispute received — invoice ${props.invoiceNo} (received late, dunning continues)`;
}

// ---------------------------------------------------------------------------
// DisputeResolvedEmail — outcome
// ---------------------------------------------------------------------------

export type DisputeResolvedEmailProps = Readonly<{
  invoiceNo: string;
  firstName: string;
  propertyAddress: string;
  decision: "conceded" | "rejected";
  /** The D1–D5 category recorded by the admin. */
  category: string;
  decisionReason: string;
  dashboardLink: string;
}>;

const CATEGORY_LABELS: Record<string, string> = {
  D1_source: "D1 — Source",
  D2_fell_through: "D2 — Fall-through",
  D3_different_applicant: "D3 — Different applicant",
  D4_no_tail_agreement: "D4 — Tail agreement",
  D5_fee_level: "D5 — Fee level",
};

export function DisputeResolvedEmail({
  invoiceNo,
  firstName,
  propertyAddress,
  decision,
  category,
  decisionReason,
  dashboardLink,
}: DisputeResolvedEmailProps) {
  const isConceded = decision === "conceded";
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <Html>
      <Head />
      <Preview>
        {isConceded
          ? `Invoice ${invoiceNo} cancelled — dispute upheld`
          : `Invoice ${invoiceNo} resumes — dispute not upheld`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Truedeed Accounts</Heading>
          </Section>
          <Section style={content}>
            <Heading style={title}>
              {isConceded
                ? `We agree — invoice ${invoiceNo} cancelled`
                : `Decision on dispute — invoice ${invoiceNo}`}
            </Heading>
            <Text style={mainText}>Hi {firstName},</Text>

            {isConceded ? (
              <Text style={mainText}>
                We&apos;ve reviewed the dispute on invoice {invoiceNo} (completion at{" "}
                {propertyAddress}) and we agree with you. The invoice has been
                cancelled and nothing is due.
              </Text>
            ) : (
              <Text style={mainText}>
                We&apos;ve reviewed the dispute on invoice {invoiceNo} (completion at{" "}
                {propertyAddress}) and on the evidence we don&apos;t agree. The
                invoice resumes from where it was paused — the dunning clock
                restarts where it stopped (billing flow §2).
              </Text>
            )}

            <Section style={detailBox}>
              <Text style={detailRow}>
                Playbook category: {categoryLabel}
              </Text>
              <Text style={detailRow}>Reason: {decisionReason}</Text>
            </Section>

            <Text style={mainText}>
              The full record is in your dashboard:{" "}
              <Link href={dashboardLink} style={link}>
                {dashboardLink}
              </Link>
            </Text>
          </Section>
          <Text style={footer}>
            Truedeed — disputes are documented decisions, not negotiations.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function disputeResolvedSubject(
  props: DisputeResolvedEmailProps,
): string {
  return props.decision === "conceded"
    ? `Invoice ${props.invoiceNo} cancelled — dispute upheld`
    : `Invoice ${props.invoiceNo} — dispute not upheld, dunning resumes`;
}

// ---------------------------------------------------------------------------
// ChargebackLetterEmail — annex letter from the ops director
// ---------------------------------------------------------------------------

export type ChargebackLetterEmailProps = Readonly<{
  invoiceNo: string;
  firstName: string;
  branchName: string;
  /** Formatted date when the 10-business-day dispute channel closes. */
  disputeDeadline: string;
  dashboardLink: string;
  opsDirectorName: string;
}>;

export function ChargebackLetterEmail({
  invoiceNo,
  firstName,
  branchName,
  disputeDeadline,
  dashboardLink,
  opsDirectorName,
}: ChargebackLetterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Chargeback received on invoice {invoiceNo} — auto-collection frozen,
        debt survives
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Truedeed — Operations</Heading>
          </Section>
          <Section style={content}>
            <Heading style={title}>
              Chargeback on invoice {invoiceNo}
            </Heading>
            <Text style={mainText}>Dear {firstName},</Text>
            <Text style={mainText}>
              We&apos;ve been notified by GoCardless that the Direct Debit collection
              on invoice {invoiceNo} for {branchName} has been clawed back under
              the Direct Debit Guarantee.
            </Text>
            <Text style={mainText}>
              The Guarantee is your right and we acknowledge it. Three things
              follow from it, in order:
            </Text>

            <Section style={detailBox}>
              <Text style={detailRow}>
                1. We have frozen automatic collection for {branchName}. We will
                not silently re-collect this amount by Direct Debit.
              </Text>
              <Text style={detailRow}>
                2. The Guarantee reverses the bank transaction. It does not
                cancel the contractual debt — the Success Fee for the
                introduction recorded against this invoice survives as a
                commercial debt and remains payable under your Network
                Agreement.
              </Text>
              <Text style={detailRow}>
                3. Your Network Agreement treats an unjustified Guarantee claim
                as a material breach. We do not assume that&apos;s what&apos;s happened
                here — we treat the chargeback as the start of a conversation,
                not the end of one.
              </Text>
            </Section>

            <Text style={mainText}>
              The dispute channel remains open for 10 business days from today.
              If you raise a substantive dispute inside that window we&apos;ll
              decide it on the merits exactly as if no chargeback had happened
              — the affront does not change the analysis.
            </Text>
            <Text style={mainText}>
              For completeness: a deliberately false claim — &quot;I never
              authorised this&quot; against a signed mandate and a director&apos;s
              signature — may engage the Fraud Act 2006. We&apos;re stating that as
              fact, not as a threat.
            </Text>
            <Text style={mainText}>
              Reply to this email, or raise the dispute through the dashboard:{" "}
              <Link href={dashboardLink} style={link}>
                {dashboardLink}
              </Link>
              . Dispute channel closes on {disputeDeadline}.
            </Text>
            <Text style={mainText}>
              Yours,
              <br />
              {opsDirectorName}
              <br />
              Truedeed
            </Text>
          </Section>
          <Text style={footer}>
            Truedeed — completion-only network fees, evidence-grade attribution.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function chargebackLetterSubject(
  props: ChargebackLetterEmailProps,
): string {
  return `Chargeback on invoice ${props.invoiceNo} — auto-collection frozen, debt survives`;
}
