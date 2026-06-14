/**
 * Inngest functions: Truedeed billing emails (billing spec §2 timeline, §4 copy).
 *
 * One consumer per billing event — all share the same shape
 * (pattern: truedeed-notify-introduction.ts):
 *   1. Load invoice + introduction/listing address
 *   2. Resolve recipient (branch email, else agent profile, else auth email)
 *   3. Render the spec §4 template variant, send via Resend, log to email_logs
 *   4. Write a truedeed_audit_log row (these emails are evidence)
 *
 *   truedeed/invoice.created        → Email 0 (service message)
 *   truedeed/invoice.payment-failed → Email 1 (D+0)
 *   truedeed/invoice.reminder       → Email 2 (D+7)
 *   truedeed/invoice.final-notice   → Email 3 (D+14, statutory interest itemised)
 *   truedeed/invoice.suspended      → Email 4 (D+21) + suspendOrgBilling
 *   truedeed/invoice.paid           → Email 5 + reinstateOrgBilling (only when
 *                                     the org was billing-suspended — a normal
 *                                     on-time payment sends nothing, spec §2)
 *   truedeed/mandate.broken         → clause 8.3 notice (10 business days)
 */

import { Resend } from "resend";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import {
  getEnglandWalesBankHolidays,
  addBusinessDays,
} from "@/lib/business-days";
import { DUNNING_DAYS } from "@/lib/truedeed/dunning-machine";
import {
  interestToDatePence,
  dailyInterestPence,
  totalNowDuePence,
} from "@/lib/truedeed/late-payment";
import {
  suspendOrgBilling,
  reinstateOrgBilling,
} from "@/services/truedeed/dunning-service";
import type { InvoiceEmailProps } from "@/lib/email/templates/InvoiceEmail";

const MANDATE_REAUTH_BUSINESS_DAYS = 10; // clause 8.3

// Lazy-initialize so the Resend SDK does not throw at module evaluation time.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Spec §4: sender accounts@truedeed.co.uk, reply-to monitored.
const FROM = "Truedeed Accounts <accounts@truedeed.co.uk>";

// Business config merge fields (spec §4: {account_details}, {phone},
// {ops_director_name}) — env-overridable, never hardcoded bank data.
const ACCOUNT_DETAILS =
  process.env.TRUEDEED_BANK_DETAILS ?? "the account shown on your invoice";
const ACCOUNTS_PHONE =
  process.env.TRUEDEED_ACCOUNTS_PHONE ?? "the phone number on your invoice";
const OPS_DIRECTOR_NAME =
  process.env.TRUEDEED_OPS_DIRECTOR ?? "Operations Director";

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "Europe/London",
});

function formatDate(iso: string): string {
  return EN_GB_DATE.format(new Date(iso));
}

function formatPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

/** "£249" not "£249.00" for the Email 0 net figure (spec §4). */
function formatNet(pence: number): string {
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2);
}

function addCalendarDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
}

// ---------------------------------------------------------------------------
// Shared loading + sending helpers (called inside step.run)
// ---------------------------------------------------------------------------

type InvoiceRow = {
  id: string;
  invoice_number: string;
  net_pence: number;
  gross_pence: number;
  due_at: string;
  state: string;
  org_agent_id: string;
  introduction_id: string | null;
};

type IntroductionRow = {
  id: string;
  applicant_name: string | null;
  occurred_at: string | null;
  notified_at: string | null;
  branch_id: string | null;
  agent_id: string;
  listings: {
    properties: {
      address_line1: string | null;
      postcode: string | null;
    } | null;
  } | null;
};

type InvoiceEmailContext = {
  invoice: InvoiceRow;
  recipient: string;
  firstName: string;
  branchName: string;
  propertyAddress: string;
  applicantName: string;
  /** introductions.occurred_at, ISO (may be null for legacy rows). */
  introducedAt: string | null;
  /** introductions.notified_at, ISO (clause 3.1 notification). */
  notifiedAt: string | null;
};

/**
 * Load the invoice, its introduction/listing address, and resolve the
 * recipient: branch email if set, else agent profile email, else auth email
 * (Phase 1 resolution pattern from truedeed-notify-introduction.ts).
 */
async function loadInvoiceEmailContext(
  invoiceId: string,
): Promise<InvoiceEmailContext | null> {
  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, net_pence, gross_pence, due_at, state, org_agent_id, introduction_id",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch invoice ${invoiceId}: ${error.message}`);
  }
  if (!invoice) return null;
  const invoiceRow = invoice as unknown as InvoiceRow;

  let intro: IntroductionRow | null = null;
  if (invoiceRow.introduction_id) {
    const { data } = await supabase
      .from("introductions")
      .select(
        "id, applicant_name, occurred_at, notified_at, branch_id, agent_id, listings(properties(address_line1, postcode))",
      )
      .eq("id", invoiceRow.introduction_id)
      .maybeSingle();
    intro = data as unknown as IntroductionRow | null;
  }

  // Recipient + branch name: branch first, then the org agent.
  let recipient: string | null = null;
  let branchName: string | null = null;
  if (intro?.branch_id) {
    const { data: branch } = await supabase
      .from("agent_branches")
      .select("email, name")
      .eq("id", intro.branch_id)
      .maybeSingle();
    const branchRow = branch as { email: string | null; name: string | null } | null;
    if (branchRow?.email) recipient = branchRow.email;
    if (branchRow?.name) branchName = branchRow.name;
  }

  const agentId = intro?.agent_id ?? invoiceRow.org_agent_id;
  let fullName: string | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", agentId)
    .maybeSingle();
  const profileRow = profile as {
    email: string | null;
    full_name: string | null;
  } | null;
  fullName = profileRow?.full_name ?? null;
  if (!recipient && profileRow?.email) recipient = profileRow.email;

  if (!recipient) {
    const { data: authUser } = await supabase.auth.admin.getUserById(agentId);
    recipient = authUser?.user?.email ?? null;
  }

  if (!branchName) {
    const { data: agency } = await supabase
      .from("agent_agency_profiles")
      .select("agency_name")
      .eq("agent_id", invoiceRow.org_agent_id)
      .maybeSingle();
    branchName =
      (agency as { agency_name: string | null } | null)?.agency_name ?? null;
  }

  if (!recipient) {
    captureException(
      new Error(`No recipient email for invoice ${invoiceId}`),
      {
        module: "truedeed",
        feature: "invoice-emails",
        operation: "resolveRecipient",
        extra: { invoiceId, orgAgentId: invoiceRow.org_agent_id },
      },
    );
    return null;
  }

  const property = intro?.listings?.properties;
  const propertyAddress =
    [property?.address_line1, property?.postcode].filter(Boolean).join(", ") ||
    "the listed property";

  return {
    invoice: invoiceRow,
    recipient,
    firstName: fullName?.split(" ")[0] || "there",
    branchName: branchName ?? "your branch",
    propertyAddress,
    applicantName: intro?.applicant_name ?? "the applicant",
    introducedAt: intro?.occurred_at ?? null,
    notifiedAt: intro?.notified_at ?? null,
  };
}

/**
 * Render + send one spec §4 variant via Resend, log to email_logs
 * ('invoice_email_0'..'invoice_email_5') and truedeed_audit_log.
 * Throws on send failure so Inngest retries.
 */
async function sendInvoiceEmail(
  ctx: InvoiceEmailContext,
  props: InvoiceEmailProps,
): Promise<{ resendId: string | null }> {
  const supabase = createAdminClient();
  const template = `invoice_email_${props.variant}`;

  try {
    const { default: InvoiceEmail, invoiceEmailSubject } = await import(
      "@/lib/email/templates/InvoiceEmail"
    );
    const { render } = await import("@react-email/components");
    const html = await render(InvoiceEmail(props));

    const { data, error } = await getResend().emails.send({
      from: FROM,
      to: ctx.recipient,
      subject: invoiceEmailSubject(props),
      html,
    });

    if (error) throw new Error(error.message);

    await supabase.from("email_logs").insert({
      user_id: ctx.invoice.org_agent_id,
      template,
      recipient: ctx.recipient,
      resend_id: data?.id ?? null,
      status: "sent",
    });

    // Audit: these sends are dispute/letter-before-action evidence (spec §5).
    await supabase.from("truedeed_audit_log").insert({
      actor: null,
      action: "invoice_email_sent",
      entity: "invoice",
      entity_id: ctx.invoice.id,
      detail: {
        template,
        recipient: ctx.recipient,
        invoice_number: ctx.invoice.invoice_number,
      },
    });

    return { resendId: data?.id ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("email_logs").insert({
      user_id: ctx.invoice.org_agent_id,
      template,
      recipient: ctx.recipient,
      status: "failed",
      error_message: message,
    });
    captureException(err, {
      module: "truedeed",
      feature: "invoice-emails",
      operation: "sendEmail",
      extra: { invoiceId: ctx.invoice.id, template },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Email 0 — invoice issued (I+0, service tone)
// ---------------------------------------------------------------------------

export const truedeedInvoiceCreated = inngest.createFunction(
  { id: "truedeed-invoice-created", name: "Truedeed billing: Email 0 (invoice issued)" },
  { event: "truedeed/invoice.created" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadInvoiceEmailContext(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    const billingUrl = `${appUrl()}/dashboard/agent/billing/truedeed`;
    const result = await step.run("send-email-0", () =>
      sendInvoiceEmail(ctx, {
        variant: 0,
        invoiceNo: ctx.invoice.invoice_number,
        firstName: ctx.firstName,
        propertyAddress: ctx.propertyAddress,
        applicantName: ctx.applicantName,
        introductionDate: ctx.introducedAt
          ? formatDate(ctx.introducedAt)
          : "the recorded introduction date",
        grossAmount: formatPounds(ctx.invoice.gross_pence),
        netAmount: formatNet(ctx.invoice.net_pence),
        dueDate: formatDate(ctx.invoice.due_at),
        disputeLink: billingUrl,
        evidenceLink: `${appUrl()}/dashboard/agent/introductions`,
        notificationDate: ctx.notifiedAt
          ? formatDate(ctx.notifiedAt)
          : "the recorded notification date",
      }),
    );

    return { status: "sent", invoiceId, ...result };
  },
);

// ---------------------------------------------------------------------------
// Email 1 — payment failed / overdue (D+0)
// ---------------------------------------------------------------------------

export const truedeedInvoicePaymentFailed = inngest.createFunction(
  { id: "truedeed-invoice-payment-failed", name: "Truedeed billing: Email 1 (payment failed)" },
  { event: "truedeed/invoice.payment-failed" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadInvoiceEmailContext(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    const billingUrl = `${appUrl()}/dashboard/agent/billing/truedeed`;
    const result = await step.run("send-email-1", () =>
      sendInvoiceEmail(ctx, {
        variant: 1,
        invoiceNo: ctx.invoice.invoice_number,
        firstName: ctx.firstName,
        grossAmount: formatPounds(ctx.invoice.gross_pence),
        dueDate: formatDate(ctx.invoice.due_at),
        accountDetails: ACCOUNT_DETAILS,
        mandateLink: billingUrl,
        disputeLink: billingUrl,
      }),
    );

    return { status: "sent", invoiceId, ...result };
  },
);

// ---------------------------------------------------------------------------
// Email 2 — reminder + announced retry (D+7)
// ---------------------------------------------------------------------------

export const truedeedInvoiceReminder = inngest.createFunction(
  { id: "truedeed-invoice-reminder", name: "Truedeed billing: Email 2 (7-day reminder)" },
  { event: "truedeed/invoice.reminder" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadInvoiceEmailContext(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    const dueAt = ctx.invoice.due_at;
    const result = await step.run("send-email-2", () =>
      sendInvoiceEmail(ctx, {
        variant: 2,
        invoiceNo: ctx.invoice.invoice_number,
        firstName: ctx.firstName,
        grossAmount: formatPounds(ctx.invoice.gross_pence),
        propertyAddress: ctx.propertyAddress,
        retryDate: formatDate(addCalendarDays(dueAt, DUNNING_DAYS.REMINDER)),
        interestStartDate: formatDate(
          addCalendarDays(dueAt, DUNNING_DAYS.FINAL_NOTICE),
        ),
        suspensionDate: formatDate(
          addCalendarDays(dueAt, DUNNING_DAYS.SUSPEND),
        ),
      }),
    );

    return { status: "sent", invoiceId, ...result };
  },
);

// ---------------------------------------------------------------------------
// Email 3 — formal notice with statutory interest itemisation (D+14)
// ---------------------------------------------------------------------------

export const truedeedInvoiceFinalNotice = inngest.createFunction(
  { id: "truedeed-invoice-final-notice", name: "Truedeed billing: Email 3 (formal notice)" },
  { event: "truedeed/invoice.final-notice" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadInvoiceEmailContext(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    // Spec §3 arithmetic via @/lib/truedeed/late-payment — memoized in a step
    // so the itemised figures are stable across retries.
    const amounts = await step.run("compute-amounts", () => {
      const gross = ctx.invoice.gross_pence;
      const dueDate = ctx.invoice.due_at.slice(0, 10);
      const asOf = new Date().toISOString().slice(0, 10);
      const due = totalNowDuePence(gross, dueDate, asOf);
      return {
        interestToDate: formatPounds(
          interestToDatePence(gross, dueDate, asOf),
        ),
        fixedSum: formatPounds(due.fixedSumPence),
        totalDue: formatPounds(due.totalPence),
        dailyRate: formatPounds(dailyInterestPence(gross, dueDate)),
      };
    });

    const billingUrl = `${appUrl()}/dashboard/agent/billing/truedeed`;
    const result = await step.run("send-email-3", () =>
      sendInvoiceEmail(ctx, {
        variant: 3,
        invoiceNo: ctx.invoice.invoice_number,
        firstName: ctx.firstName,
        grossAmount: formatPounds(ctx.invoice.gross_pence),
        interestToDate: amounts.interestToDate,
        fixedSum: amounts.fixedSum,
        totalDue: amounts.totalDue,
        dailyRate: amounts.dailyRate,
        branchName: ctx.branchName,
        suspensionDate: formatDate(
          addCalendarDays(ctx.invoice.due_at, DUNNING_DAYS.SUSPEND),
        ),
        paymentLink: billingUrl,
        disputeLink: billingUrl,
        phone: ACCOUNTS_PHONE,
        opsDirectorName: OPS_DIRECTOR_NAME,
      }),
    );

    return { status: "sent", invoiceId, ...result };
  },
);

// ---------------------------------------------------------------------------
// Email 4 — suspension (D+21) + suspendOrgBilling (clause 11.1(a))
// ---------------------------------------------------------------------------

export const truedeedInvoiceSuspended = inngest.createFunction(
  { id: "truedeed-invoice-suspended", name: "Truedeed billing: Email 4 (suspension)" },
  { event: "truedeed/invoice.suspended" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadInvoiceEmailContext(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    // Flip the org-level billing flag (hides listings, blocks referencing).
    await step.run("suspend-org-billing", () =>
      suspendOrgBilling(ctx.invoice.org_agent_id),
    );

    const amounts = await step.run("compute-amounts", () => {
      const gross = ctx.invoice.gross_pence;
      const dueDate = ctx.invoice.due_at.slice(0, 10);
      const asOf = new Date().toISOString().slice(0, 10);
      return {
        totalDue: formatPounds(totalNowDuePence(gross, dueDate, asOf).totalPence),
      };
    });

    const result = await step.run("send-email-4", () =>
      sendInvoiceEmail(ctx, {
        variant: 4,
        invoiceNo: ctx.invoice.invoice_number,
        firstName: ctx.firstName,
        branchName: ctx.branchName,
        email3Date: formatDate(
          addCalendarDays(ctx.invoice.due_at, DUNNING_DAYS.FINAL_NOTICE),
        ),
        totalDue: amounts.totalDue,
        paymentLink: `${appUrl()}/dashboard/agent/billing/truedeed`,
        opsDirectorName: OPS_DIRECTOR_NAME,
      }),
    );

    return { status: "sent", invoiceId, ...result };
  },
);

// ---------------------------------------------------------------------------
// Email 5 — reinstatement on payment + reinstateOrgBilling
// ---------------------------------------------------------------------------

export const truedeedInvoicePaid = inngest.createFunction(
  { id: "truedeed-invoice-paid", name: "Truedeed billing: Email 5 (reinstatement)" },
  { event: "truedeed/invoice.paid" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadInvoiceEmailContext(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    // Spec §2: a normal on-time payment is "paid, done" — Email 5 and the
    // reinstatement only apply when the org was billing-suspended.
    const wasSuspended = await step.run("check-suspension", async () => {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("agent_agency_profiles")
        .select("billing_suspended_at")
        .eq("agent_id", ctx.invoice.org_agent_id)
        .maybeSingle();
      return Boolean(
        (data as { billing_suspended_at: string | null } | null)
          ?.billing_suspended_at,
      );
    });

    if (!wasSuspended) {
      return { status: "paid_no_reinstatement", invoiceId };
    }

    await step.run("reinstate-org-billing", () =>
      reinstateOrgBilling(ctx.invoice.org_agent_id),
    );

    const result = await step.run("send-email-5", () =>
      sendInvoiceEmail(ctx, {
        variant: 5,
        invoiceNo: ctx.invoice.invoice_number,
        firstName: ctx.firstName,
        branchName: ctx.branchName,
        mandateLink: `${appUrl()}/dashboard/agent/billing/truedeed`,
      }),
    );

    return { status: "reinstated", invoiceId, ...result };
  },
);

// ---------------------------------------------------------------------------
// Mandate broken — clause 8.3 notice (10 business days to re-establish)
// ---------------------------------------------------------------------------

export const truedeedMandateBroken = inngest.createFunction(
  { id: "truedeed-mandate-broken", name: "Truedeed billing: mandate broken (clause 8.3)" },
  { event: "truedeed/mandate.broken" },
  async ({ event, step }) => {
    const { mandateId } = event.data as { mandateId: string };
    const supabase = createAdminClient();

    const org = await step.run("load-org", async () => {
      const { data, error } = await supabase
        .from("agent_agency_profiles")
        .select("agent_id, agency_name, contact_email")
        .eq("gocardless_mandate_id", mandateId)
        .maybeSingle();
      if (error) {
        throw new Error(
          `Failed to fetch org for mandate ${mandateId}: ${error.message}`,
        );
      }
      return data as {
        agent_id: string;
        agency_name: string | null;
        contact_email: string | null;
      } | null;
    });

    if (!org) return { status: "org_not_found", mandateId };

    const recipient = await step.run("resolve-recipient", async () => {
      if (org.contact_email) return org.contact_email;
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", org.agent_id)
        .maybeSingle();
      const profileEmail = (profile as { email: string | null } | null)?.email;
      if (profileEmail) return profileEmail;
      const { data: authUser } = await supabase.auth.admin.getUserById(
        org.agent_id,
      );
      return authUser?.user?.email ?? null;
    });

    if (!recipient) return { status: "no_recipient", mandateId };

    // Clause 8.3 clock: 10 England & Wales business days to re-establish.
    const reauthoriseBy = await step.run("compute-deadline", async () => {
      const holidays = await getEnglandWalesBankHolidays();
      return addBusinessDays(
        new Date(),
        MANDATE_REAUTH_BUSINESS_DAYS,
        holidays,
      ).toISOString();
    });

    await step.run("send-email", async () => {
      try {
        const { MandateBrokenEmail } = await import(
          "@/lib/email/templates/InvoiceEmail"
        );
        const { render } = await import("@react-email/components");
        const branchName = org.agency_name ?? "your branch";
        const html = await render(
          MandateBrokenEmail({
            firstName: "there",
            branchName,
            reauthoriseBy: formatDate(reauthoriseBy),
            mandateLink: `${appUrl()}/dashboard/agent/billing/truedeed`,
          }),
        );

        const { data, error } = await getResend().emails.send({
          from: FROM,
          to: recipient,
          subject: `Direct Debit mandate broken — re-establish by ${formatDate(reauthoriseBy)}`,
          html,
        });
        if (error) throw new Error(error.message);

        await supabase.from("email_logs").insert({
          user_id: org.agent_id,
          template: "mandate_broken",
          recipient,
          resend_id: data?.id ?? null,
          status: "sent",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase.from("email_logs").insert({
          user_id: org.agent_id,
          template: "mandate_broken",
          recipient,
          status: "failed",
          error_message: message,
        });
        captureException(err, {
          module: "truedeed",
          feature: "invoice-emails",
          operation: "sendMandateBrokenEmail",
          extra: { mandateId },
        });
        throw err;
      }
    });

    await step.run("audit", async () => {
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "mandate_broken_notified",
        entity: "mandate",
        entity_id: org.agent_id,
        detail: {
          mandate_id: mandateId,
          recipient,
          reauthorise_by: reauthoriseBy,
        },
      });
    });

    return { status: "notified", mandateId, recipient, reauthoriseBy };
  },
);
