/**
 * Inngest functions — Truedeed Phase 5 dispute family.
 *
 *   truedeed/dispute.raised      → DisputeRaisedEmail (clause 9.5 confirmation)
 *   truedeed/dispute.resolved    → DisputeResolvedEmail (outcome + category)
 *   truedeed/invoice.charged_back → ChargebackLetterEmail (annex letter)
 *
 * All three reuse the spec §4 invoice-emails idiom (lazy Resend, evidence
 * audit-logging, email_logs, captureException). Recipient resolution is
 * branch-first then agent profile then auth (Phase 1 pattern). All emails
 * are evidence under clause 11 — audit-log every send.
 */

import { Resend } from "resend";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import { appBaseUrl } from "@/config/brand";
import {
  getEnglandWalesBankHolidays,
  addBusinessDays,
} from "@/lib/business-days";

const FROM_ACCOUNTS = "Truedeed Accounts <accounts@truedeed.co.uk>";
const FROM_OPS = "Truedeed Operations <ops@truedeed.co.uk>";
const OPS_DIRECTOR_NAME =
  process.env.TRUEDEED_OPS_DIRECTOR ?? "Operations Director";

const CHARGEBACK_DISPUTE_WINDOW_BUSINESS_DAYS = 10;

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "Europe/London",
});

function formatDate(iso: string): string {
  return EN_GB_DATE.format(new Date(iso));
}

function appUrl(): string {
  return appBaseUrl();
}

// ---------------------------------------------------------------------------
// Shared context: invoice + introduction + recipient + branch
// ---------------------------------------------------------------------------

type DisputeMailContext = {
  invoiceId: string;
  invoiceNumber: string;
  orgAgentId: string;
  recipient: string;
  firstName: string;
  branchName: string;
  propertyAddress: string;
};

async function loadDisputeMailContextByInvoice(
  invoiceId: string,
): Promise<DisputeMailContext | null> {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, org_agent_id, introduction_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return null;
  const invoiceRow = invoice as {
    id: string;
    invoice_number: string;
    org_agent_id: string;
    introduction_id: string | null;
  };

  let branchId: string | null = null;
  let propertyAddress = "the listed property";
  if (invoiceRow.introduction_id) {
    const { data: intro } = await supabase
      .from("introductions")
      .select(
        "branch_id, listings(properties(address_line1, postcode))",
      )
      .eq("id", invoiceRow.introduction_id)
      .maybeSingle();
    const introRow = intro as {
      branch_id: string | null;
      listings: {
        properties: {
          address_line1: string | null;
          postcode: string | null;
        } | null;
      } | null;
    } | null;
    branchId = introRow?.branch_id ?? null;
    const property = introRow?.listings?.properties;
    propertyAddress =
      [property?.address_line1, property?.postcode].filter(Boolean).join(", ") ||
      propertyAddress;
  }

  let recipient: string | null = null;
  let branchName: string | null = null;
  if (branchId) {
    const { data: branch } = await supabase
      .from("agent_branches")
      .select("email, name")
      .eq("id", branchId)
      .maybeSingle();
    const row = branch as {
      email: string | null;
      name: string | null;
    } | null;
    if (row?.email) recipient = row.email;
    if (row?.name) branchName = row.name;
  }

  let fullName: string | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", invoiceRow.org_agent_id)
    .maybeSingle();
  const profileRow = profile as {
    email: string | null;
    full_name: string | null;
  } | null;
  fullName = profileRow?.full_name ?? null;
  if (!recipient && profileRow?.email) recipient = profileRow.email;

  if (!recipient) {
    const { data: authUser } = await supabase.auth.admin.getUserById(
      invoiceRow.org_agent_id,
    );
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
        feature: "dispute-emails",
        operation: "resolveRecipient",
        extra: { invoiceId, orgAgentId: invoiceRow.org_agent_id },
      },
    );
    return null;
  }

  return {
    invoiceId,
    invoiceNumber: invoiceRow.invoice_number,
    orgAgentId: invoiceRow.org_agent_id,
    recipient,
    firstName: fullName?.split(" ")[0] || "there",
    branchName: branchName ?? "your branch",
    propertyAddress,
  };
}

async function loadDisputeMailContextByDispute(
  disputeId: string,
): Promise<{
  ctx: DisputeMailContext;
  dispute: {
    id: string;
    invoice_id: string;
    properly_raised: boolean;
    raised_at: string;
    status: string;
    category: string | null;
    decision_reason: string | null;
  };
} | null> {
  const supabase = createAdminClient();
  const { data: dispute } = await supabase
    .from("invoice_disputes")
    .select(
      "id, invoice_id, properly_raised, raised_at, status, category, decision_reason",
    )
    .eq("id", disputeId)
    .maybeSingle();
  if (!dispute) return null;
  const disputeRow = dispute as {
    id: string;
    invoice_id: string;
    properly_raised: boolean;
    raised_at: string;
    status: string;
    category: string | null;
    decision_reason: string | null;
  };

  const ctx = await loadDisputeMailContextByInvoice(disputeRow.invoice_id);
  if (!ctx) return null;
  return { ctx, dispute: disputeRow };
}

async function logSend(
  template: string,
  orgAgentId: string,
  recipient: string,
  resendId: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("email_logs").insert({
    user_id: orgAgentId,
    template,
    recipient,
    resend_id: resendId,
    status: "sent",
  });
}

async function logFailure(
  template: string,
  orgAgentId: string,
  recipient: string,
  message: string,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("email_logs").insert({
    user_id: orgAgentId,
    template,
    recipient,
    status: "failed",
    error_message: message,
  });
}

async function auditSend(
  action: string,
  entity: string,
  entityId: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("truedeed_audit_log").insert({
    actor: null,
    action,
    entity,
    entity_id: entityId,
    detail,
  });
}

// ---------------------------------------------------------------------------
// truedeed/dispute.raised → DisputeRaisedEmail
// ---------------------------------------------------------------------------

export const truedeedDisputeRaised = inngest.createFunction(
  {
    id: "truedeed-dispute-raised",
    name: "Truedeed dispute: confirmation email on raise",
  },
  { event: "truedeed/dispute.raised" },
  async ({ event, step }) => {
    const { disputeId } = event.data as { disputeId: string };

    const loaded = await step.run("load-dispute", () =>
      loadDisputeMailContextByDispute(disputeId),
    );
    if (!loaded) return { status: "skipped", disputeId };
    const { ctx, dispute } = loaded;

    const windowEnd = await step.run("compute-window-end", async () => {
      const holidays = await getEnglandWalesBankHolidays();
      const issued = new Date(dispute.raised_at);
      return addBusinessDays(issued, 10, holidays).toISOString();
    });

    await step.run("send-email", async () => {
      const template = `dispute_raised_${dispute.properly_raised ? "properly" : "late"}`;
      try {
        const {
          DisputeRaisedEmail,
          disputeRaisedSubject,
        } = await import("@/lib/email/templates/DisputeEmails");
        const { render } = await import("@react-email/components");
        const props = {
          invoiceNo: ctx.invoiceNumber,
          firstName: ctx.firstName,
          propertyAddress: ctx.propertyAddress,
          properlyRaised: dispute.properly_raised,
          windowEndDate: formatDate(windowEnd),
          dashboardLink: `${appUrl()}/dashboard/agent/billing/truedeed`,
        };
        const html = await render(DisputeRaisedEmail(props));

        const { data, error } = await getResend().emails.send({
          from: FROM_ACCOUNTS,
          to: ctx.recipient,
          subject: disputeRaisedSubject(props),
          html,
        });
        if (error) throw new Error(error.message);

        await logSend(template, ctx.orgAgentId, ctx.recipient, data?.id ?? null);
        await auditSend(
          "dispute_raised_email_sent",
          "invoice_disputes",
          disputeId,
          {
            template,
            recipient: ctx.recipient,
            invoice_number: ctx.invoiceNumber,
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await logFailure(template, ctx.orgAgentId, ctx.recipient, message);
        captureException(err, {
          module: "truedeed",
          feature: "dispute-emails",
          operation: "sendDisputeRaisedEmail",
          extra: { disputeId },
        });
        throw err;
      }
    });

    return {
      status: "sent",
      disputeId,
      properlyRaised: dispute.properly_raised,
    };
  },
);

// ---------------------------------------------------------------------------
// truedeed/dispute.resolved → DisputeResolvedEmail
// ---------------------------------------------------------------------------

export const truedeedDisputeResolved = inngest.createFunction(
  {
    id: "truedeed-dispute-resolved",
    name: "Truedeed dispute: outcome email on resolve",
  },
  { event: "truedeed/dispute.resolved" },
  async ({ event, step }) => {
    const { disputeId } = event.data as { disputeId: string };

    const loaded = await step.run("load-dispute", () =>
      loadDisputeMailContextByDispute(disputeId),
    );
    if (!loaded) return { status: "skipped", disputeId };
    const { ctx, dispute } = loaded;

    if (dispute.status !== "conceded" && dispute.status !== "rejected") {
      return { status: "skipped_not_decided", disputeId };
    }

    await step.run("send-email", async () => {
      const template = `dispute_resolved_${dispute.status}`;
      try {
        const {
          DisputeResolvedEmail,
          disputeResolvedSubject,
        } = await import("@/lib/email/templates/DisputeEmails");
        const { render } = await import("@react-email/components");
        const props = {
          invoiceNo: ctx.invoiceNumber,
          firstName: ctx.firstName,
          propertyAddress: ctx.propertyAddress,
          decision: dispute.status as "conceded" | "rejected",
          category: dispute.category ?? "",
          decisionReason: dispute.decision_reason ?? "",
          dashboardLink: `${appUrl()}/dashboard/agent/billing/truedeed`,
        };
        const html = await render(DisputeResolvedEmail(props));

        const { data, error } = await getResend().emails.send({
          from: FROM_ACCOUNTS,
          to: ctx.recipient,
          subject: disputeResolvedSubject(props),
          html,
        });
        if (error) throw new Error(error.message);

        await logSend(template, ctx.orgAgentId, ctx.recipient, data?.id ?? null);
        await auditSend(
          "dispute_resolved_email_sent",
          "invoice_disputes",
          disputeId,
          {
            template,
            decision: dispute.status,
            recipient: ctx.recipient,
            invoice_number: ctx.invoiceNumber,
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await logFailure(template, ctx.orgAgentId, ctx.recipient, message);
        captureException(err, {
          module: "truedeed",
          feature: "dispute-emails",
          operation: "sendDisputeResolvedEmail",
          extra: { disputeId },
        });
        throw err;
      }
    });

    return { status: "sent", disputeId, decision: dispute.status };
  },
);

// ---------------------------------------------------------------------------
// truedeed/invoice.charged_back → ChargebackLetterEmail (annex)
// ---------------------------------------------------------------------------

export const truedeedInvoiceChargedBack = inngest.createFunction(
  {
    id: "truedeed-invoice-charged-back",
    name: "Truedeed dispute: ops-director letter on chargeback (annex)",
  },
  { event: "truedeed/invoice.charged_back" },
  async ({ event, step }) => {
    const { invoiceId } = event.data as { invoiceId: string };

    const ctx = await step.run("load-invoice", () =>
      loadDisputeMailContextByInvoice(invoiceId),
    );
    if (!ctx) return { status: "skipped", invoiceId };

    const disputeDeadline = await step.run("compute-deadline", async () => {
      const holidays = await getEnglandWalesBankHolidays();
      return addBusinessDays(
        new Date(),
        CHARGEBACK_DISPUTE_WINDOW_BUSINESS_DAYS,
        holidays,
      ).toISOString();
    });

    await step.run("send-letter", async () => {
      const template = "chargeback_letter";
      try {
        const {
          ChargebackLetterEmail,
          chargebackLetterSubject,
        } = await import("@/lib/email/templates/DisputeEmails");
        const { render } = await import("@react-email/components");
        const props = {
          invoiceNo: ctx.invoiceNumber,
          firstName: ctx.firstName,
          branchName: ctx.branchName,
          disputeDeadline: formatDate(disputeDeadline),
          dashboardLink: `${appUrl()}/dashboard/agent/billing/truedeed`,
          opsDirectorName: OPS_DIRECTOR_NAME,
        };
        const html = await render(ChargebackLetterEmail(props));

        const { data, error } = await getResend().emails.send({
          from: FROM_OPS,
          to: ctx.recipient,
          subject: chargebackLetterSubject(props),
          html,
        });
        if (error) throw new Error(error.message);

        await logSend(template, ctx.orgAgentId, ctx.recipient, data?.id ?? null);
        await auditSend(
          "chargeback_letter_sent",
          "invoices",
          invoiceId,
          {
            template,
            recipient: ctx.recipient,
            invoice_number: ctx.invoiceNumber,
            dispute_deadline: disputeDeadline,
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await logFailure(template, ctx.orgAgentId, ctx.recipient, message);
        captureException(err, {
          module: "truedeed",
          feature: "dispute-emails",
          operation: "sendChargebackLetterEmail",
          extra: { invoiceId },
        });
        throw err;
      }
    });

    return { status: "letter_sent", invoiceId, disputeDeadline };
  },
);
