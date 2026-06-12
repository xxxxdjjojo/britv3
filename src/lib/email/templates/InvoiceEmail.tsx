/**
 * Truedeed billing email family — Emails 0–5 (billing spec §4) plus the
 * clause 8.3 mandate-broken notice. One parameterised template; copy follows
 * docs/truedeed/billing-flow-gocardless.md §4 exactly (merge fields filled).
 *
 * Tone targets (spec §4): firm, specific, never apologetic, never hostile;
 * every email names the exact next event and date. These emails are evidence
 * (Email 3 is the letter-before-action substrate) — keep them plain.
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
  Link,
} from "@react-email/components";

// ---------------------------------------------------------------------------
// Props (discriminated on `variant` = spec §4 email number)
// ---------------------------------------------------------------------------

type Email0Props = Readonly<{
  variant: 0;
  invoiceNo: string;
  firstName: string;
  propertyAddress: string;
  applicantName: string;
  introductionDate: string;
  /** Formatted gross, e.g. "298.80". */
  grossAmount: string;
  /** Formatted net, e.g. "249". */
  netAmount: string;
  dueDate: string;
  disputeLink: string;
  evidenceLink: string;
  notificationDate: string;
}>;

type Email1Props = Readonly<{
  variant: 1;
  invoiceNo: string;
  firstName: string;
  grossAmount: string;
  dueDate: string;
  accountDetails: string;
  mandateLink: string;
  disputeLink: string;
}>;

type Email2Props = Readonly<{
  variant: 2;
  invoiceNo: string;
  firstName: string;
  grossAmount: string;
  propertyAddress: string;
  retryDate: string;
  interestStartDate: string;
  suspensionDate: string;
}>;

type Email3Props = Readonly<{
  variant: 3;
  invoiceNo: string;
  firstName: string;
  grossAmount: string;
  /** Statutory interest accrued to date, formatted ("2.89"). */
  interestToDate: string;
  /** s.5A fixed sum, formatted ("40.00"). */
  fixedSum: string;
  /** Principal + interest + fixed sum, formatted ("341.69"). */
  totalDue: string;
  /** Daily accrual, formatted ("0.10"). */
  dailyRate: string;
  branchName: string;
  suspensionDate: string;
  paymentLink: string;
  disputeLink: string;
  phone: string;
  opsDirectorName: string;
}>;

type Email4Props = Readonly<{
  variant: 4;
  invoiceNo: string;
  firstName: string;
  branchName: string;
  email3Date: string;
  totalDue: string;
  paymentLink: string;
  opsDirectorName: string;
}>;

type Email5Props = Readonly<{
  variant: 5;
  invoiceNo: string;
  firstName: string;
  branchName: string;
  mandateLink: string;
}>;

export type InvoiceEmailProps =
  | Email0Props
  | Email1Props
  | Email2Props
  | Email3Props
  | Email4Props
  | Email5Props;

/** Subject lines, spec §4 verbatim. */
export function invoiceEmailSubject(props: InvoiceEmailProps): string {
  switch (props.variant) {
    case 0:
      return `Invoice ${props.invoiceNo} — completion at ${props.propertyAddress}`;
    case 1:
      return `Invoice ${props.invoiceNo} — payment didn't go through`;
    case 2:
      return `Invoice ${props.invoiceNo} — 7 days overdue, retry scheduled`;
    case 3:
      return `Formal notice — invoice ${props.invoiceNo}, suspension on ${props.suspensionDate}`;
    case 4:
      return `${props.branchName} suspended from the Truedeed network`;
    case 5:
      return `${props.branchName} — you're back live`;
  }
}

// ---------------------------------------------------------------------------
// Per-variant bodies (spec §4 copy, merge fields in {braces} filled)
// ---------------------------------------------------------------------------

function Email0Body(props: Email0Props) {
  return (
    <>
      <Text style={mainText}>Hi {props.firstName},</Text>
      <Text style={mainText}>
        Congratulations on completing {props.propertyAddress} — recorded as
        introduced to {props.applicantName} via Truedeed on{" "}
        {props.introductionDate}.
      </Text>
      <Text style={mainText}>
        Invoice {props.invoiceNo} for £{props.grossAmount} (£{props.netAmount}{" "}
        + VAT) is attached. It&apos;s due on {props.dueDate}, and your Direct
        Debit will collect it automatically on that date — nothing for you to
        do.
      </Text>
      <Text style={mainText}>
        If anything about this invoice looks wrong, raise it in your dashboard
        within 10 working days:{" "}
        <Link style={link} href={props.disputeLink}>
          {props.disputeLink}
        </Link>
        . The introduction record, including the original notification of{" "}
        {props.notificationDate} and viewing history, is here:{" "}
        <Link style={link} href={props.evidenceLink}>
          {props.evidenceLink}
        </Link>
        .
      </Text>
      <Text style={mainText}>
        Thanks — and good selling.
        <br />
        Truedeed Accounts
      </Text>
    </>
  );
}

function Email1Body(props: Email1Props) {
  return (
    <>
      <Text style={mainText}>Hi {props.firstName},</Text>
      <Text style={mainText}>
        The Direct Debit for invoice {props.invoiceNo} (£{props.grossAmount},
        due {props.dueDate}) didn&apos;t complete — usually a cancelled mandate
        or a bank-side rejection.
      </Text>
      <Text style={mainText}>
        Two ways to fix it today: pay by bank transfer to{" "}
        {props.accountDetails} quoting {props.invoiceNo}, or re-authorise your
        Direct Debit here:{" "}
        <Link style={link} href={props.mandateLink}>
          {props.mandateLink}
        </Link>{" "}
        — we&apos;ll re-collect automatically.
      </Text>
      <Text style={mainText}>
        If you believe the invoice is wrong, the dispute process is here:{" "}
        <Link style={link} href={props.disputeLink}>
          {props.disputeLink}
        </Link>
        . A disputed invoice is paused while we resolve it; an ignored one
        isn&apos;t.
      </Text>
      <Text style={mainText}>Truedeed Accounts</Text>
    </>
  );
}

function Email2Body(props: Email2Props) {
  return (
    <>
      <Text style={mainText}>Hi {props.firstName},</Text>
      <Text style={mainText}>
        Invoice {props.invoiceNo} (£{props.grossAmount} for the completion at{" "}
        {props.propertyAddress}) is now 7 days overdue. We&apos;ll retry your
        Direct Debit on {props.retryDate}.
      </Text>
      <Text style={mainText}>
        If the retry fails, late-payment interest and the statutory £40 fixed
        sum under the Late Payment of Commercial Debts (Interest) Act 1998 will
        be added from {props.interestStartDate}, and continued non-payment
        leads to suspension from the network on {props.suspensionDate}.
      </Text>
      <Text style={mainText}>
        If there&apos;s a problem with this invoice — or with cash flow this
        month — reply to this email. Talking to us pauses nothing
        automatically, but we&apos;d rather solve it than escalate it.
      </Text>
      <Text style={mainText}>Truedeed Accounts</Text>
    </>
  );
}

function Email3Body(props: Email3Props) {
  return (
    <>
      <Text style={mainText}>{props.firstName},</Text>
      <Text style={mainText}>
        Invoice {props.invoiceNo} is 14 days overdue. As of today the amount
        owing is:
      </Text>
      <Section style={detailBox}>
        <Text style={detailRow}>
          Invoice: £{props.grossAmount} · Statutory interest to date: £
          {props.interestToDate} · Fixed sum (s.5A): £{props.fixedSum} ·{" "}
          <strong>Total: £{props.totalDue}</strong>, accruing £
          {props.dailyRate}/day.
        </Text>
      </Section>
      <Text style={mainText}>
        Under clause 11.1(a) of your Network Agreement, {props.branchName} will
        be <strong>suspended from the Truedeed network on{" "}
        {props.suspensionDate}</strong> unless payment is received or a dispute
        has been properly raised. Suspension means your listings are hidden, no
        new applicants are introduced, and referencing ordering is disabled —
        it lifts within 2 working days of payment.
      </Text>
      <Text style={mainText}>
        Pay now:{" "}
        <Link style={link} href={props.paymentLink}>
          {props.paymentLink}
        </Link>
        . Dispute:{" "}
        <Link style={link} href={props.disputeLink}>
          {props.disputeLink}
        </Link>
        . Speak to us: {props.phone}.
      </Text>
      <Text style={mainText}>{props.opsDirectorName}, Truedeed</Text>
    </>
  );
}

function Email4Body(props: Email4Props) {
  return (
    <>
      <Text style={mainText}>{props.firstName},</Text>
      <Text style={mainText}>
        As notified on {props.email3Date}, {props.branchName} was suspended
        today under clause 11.1(a): invoice {props.invoiceNo}, now £
        {props.totalDue} including statutory interest and the fixed sum.
      </Text>
      <Text style={mainText}>
        What suspension means: your listings are hidden from applicants, no new
        introductions are made to your branch, and referencing ordering is
        disabled. Fees already accrued remain payable, and introductions made
        before today keep their 6-month tail.
      </Text>
      <Text style={mainText}>
        Reinstatement is automatic within 2 working days of payment:{" "}
        <Link style={link} href={props.paymentLink}>
          {props.paymentLink}
        </Link>
        . If the debt remains unpaid at 60 days we may terminate membership and
        refer the debt, with interest and costs, for recovery.
      </Text>
      <Text style={mainText}>
        We&apos;d genuinely rather have you selling than suspended — payment
        today puts this behind us.
      </Text>
      <Text style={mainText}>{props.opsDirectorName}, Truedeed</Text>
    </>
  );
}

function Email5Body(props: Email5Props) {
  return (
    <>
      <Text style={mainText}>Hi {props.firstName},</Text>
      <Text style={mainText}>
        Payment received with thanks — invoice {props.invoiceNo} is settled and{" "}
        {props.branchName} is live again on Truedeed: listings visible,
        introductions flowing, referencing enabled.
      </Text>
      <Text style={mainText}>
        One ask: keep the Direct Debit mandate active (
        <Link style={link} href={props.mandateLink}>
          {props.mandateLink}
        </Link>{" "}
        shows its status). It&apos;s what keeps this process boring, which is
        how we both like it.
      </Text>
      <Text style={mainText}>Truedeed Accounts</Text>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

const VARIANT_HEADINGS: Record<InvoiceEmailProps["variant"], string> = {
  0: "Invoice issued",
  1: "Payment didn't go through",
  2: "7 days overdue — retry scheduled",
  3: "Formal notice",
  4: "Network suspension",
  5: "You're back live",
};

function EmailShell({
  preview,
  heading,
  reference,
  children,
}: Readonly<{
  preview: string;
  heading: string;
  reference: string;
  children: React.ReactNode;
}>) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Truedeed</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={title}>
              {heading}
            </Heading>
            {children}
          </Section>
          <Text style={footer}>{reference}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default function InvoiceEmail(props: InvoiceEmailProps) {
  let inner: React.ReactNode;
  switch (props.variant) {
    case 0:
      inner = <Email0Body {...props} />;
      break;
    case 1:
      inner = <Email1Body {...props} />;
      break;
    case 2:
      inner = <Email2Body {...props} />;
      break;
    case 3:
      inner = <Email3Body {...props} />;
      break;
    case 4:
      inner = <Email4Body {...props} />;
      break;
    case 5:
      inner = <Email5Body {...props} />;
      break;
  }

  return (
    <EmailShell
      preview={invoiceEmailSubject(props)}
      heading={VARIANT_HEADINGS[props.variant]}
      reference={`Invoice reference: ${props.invoiceNo}`}
    >
      {inner}
    </EmailShell>
  );
}

// ---------------------------------------------------------------------------
// Clause 8.3 mandate-broken notice (spec §1 — not part of the §4 family)
// ---------------------------------------------------------------------------

export type MandateBrokenEmailProps = Readonly<{
  firstName: string;
  branchName: string;
  /** Formatted clause 8.3 deadline: 10 business days from notice. */
  reauthoriseBy: string;
  mandateLink: string;
}>;

export function MandateBrokenEmail({
  firstName,
  branchName,
  reauthoriseBy,
  mandateLink,
}: MandateBrokenEmailProps) {
  return (
    <EmailShell
      preview={`Direct Debit mandate broken — re-establish by ${reauthoriseBy}`}
      heading="Your Direct Debit mandate needs attention"
      reference={`Branch: ${branchName}`}
    >
      <Text style={mainText}>Hi {firstName},</Text>
      <Text style={mainText}>
        Your bank has told us the Direct Debit mandate for {branchName} is no
        longer active — usually a cancellation, expiry or a bank-side failure.
      </Text>
      <Text style={mainText}>
        Under clause 8.3 of your Network Agreement you have{" "}
        <strong>10 business days</strong> to re-establish it — that&apos;s by{" "}
        <strong>{reauthoriseBy}</strong>. After that date your membership is
        suspended under clause 11.1(b) until a new mandate is in place.
      </Text>
      <Button style={ctaButton} href={mandateLink}>
        Re-authorise your Direct Debit
      </Button>
      <Text style={mainText}>Truedeed Accounts</Text>
    </EmailShell>
  );
}

// ---------------------------------------------------------------------------
// Styles (house style — matches IntroductionNotification.tsx)
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

const ctaButton = {
  display: "inline-block",
  backgroundColor: "#1B4D3E",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "500",
  marginBottom: "16px",
};

const footer = {
  textAlign: "center" as const,
  fontSize: "12px",
  color: "#999999",
  marginTop: "16px",
};
