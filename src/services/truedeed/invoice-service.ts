/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed invoice service (Phase 5, billing spec §1–§2, §5 —
 * `billing:create-invoice` plus the GoCardless payment-webhook reactions).
 *
 * `createInvoiceFromCandidate` turns an approved invoice candidate into the
 * Success Fee VAT invoice (£249 + £49.80 VAT = £298.80, doc §2.1), due 14
 * calendar days after issue (clause 8.1), flips the candidate
 * approved→invoiced via the SECURITY DEFINER rpc `review_invoice_candidate`,
 * and — when GoCardless is configured — creates the Bacs payment against the
 * org's mandate (charge_date = due date, doc §2.3; Idempotency-Key = the
 * invoice id). When GoCardless is NOT configured the invoice is still
 * created and a 'gc_not_configured' invoice_events row is written instead.
 *
 * `recordPaymentConfirmed` / `recordPaymentFailed` / `recordChargeback`
 * reflect GoCardless payment webhooks onto the invoice. State changes go
 * through rpc 'transition_invoice' (invoices.state is guarded) — never
 * direct updates. A chargeback freezes auto-collection only (clause 8.6):
 * audit + event rows, NO inngest event and NO billing suspension — recovery
 * is the ops/dispute path.
 *
 * Inngest events: 'truedeed/invoice.created' (email 0),
 * 'truedeed/invoice.paid' (reinstatement + email 5),
 * 'truedeed/invoice.payment-failed' (email 1).
 *
 * SECURITY NOTE: Logs carry only error_type (the Error constructor name)
 * and entity ids — never names, emails, addresses or other PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import {
  isGoCardlessConfigured,
  gcRequest,
} from "@/lib/truedeed/gocardless-client";

/** Success Fee net amount in pence (£249.00, doc §2.1). */
const NET_PENCE = 24900;
/** VAT at 20% in pence (£49.80, doc §2.1). */
const VAT_PENCE = 4980;
/** Gross collected amount in pence (£298.80, doc §2.1). */
const GROSS_PENCE = NET_PENCE + VAT_PENCE;
/** Clause 8.1: invoices fall due 14 calendar days after issue. */
const DUE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const CANDIDATE_SELECT =
  "id, status, source, introduction_id, " +
  "introduction:introductions ( id, agent_id )";

export type CreateInvoiceResult =
  | { ok: true; invoiceId: string; created: boolean }
  | { ok: false; reason: "not_found" | "not_approved" | "internal" };

type CandidateRow = {
  id: string;
  status: string;
  introduction_id: string | null;
  introduction: { id: string; agent_id: string } | null;
};

type GcPaymentResponse = {
  payments: { id: string; status?: string };
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Issues the Success Fee VAT invoice for an approved candidate, idempotently
 * (an existing invoice for the candidate short-circuits with created:false).
 * Returns null only on top-level failure. Never throws.
 */
export async function createInvoiceFromCandidate(
  candidateId: string,
): Promise<CreateInvoiceResult | null> {
  try {
    const supabase = createAdminClient();

    const { data: candidate, error: candidateError } = await supabase
      .from("invoice_candidates")
      .select(CANDIDATE_SELECT)
      .eq("id", candidateId)
      .maybeSingle();
    if (candidateError || !candidate) {
      return { ok: false, reason: "not_found" };
    }
    const row = candidate as unknown as CandidateRow;

    // Idempotency: one invoice per candidate, ever.
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("invoice_candidate_id", candidateId)
      .maybeSingle();
    if (existing) {
      return { ok: true, invoiceId: (existing as { id: string }).id, created: false };
    }

    if (row.status !== "approved") {
      return { ok: false, reason: "not_approved" };
    }
    const agentId = row.introduction?.agent_id;
    if (!agentId) {
      return { ok: false, reason: "internal" };
    }

    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + DUE_DAYS * DAY_MS);

    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        invoice_candidate_id: candidateId,
        introduction_id: row.introduction_id,
        org_agent_id: agentId,
        net_pence: NET_PENCE,
        vat_pence: VAT_PENCE,
        gross_pence: GROSS_PENCE,
        issued_at: issuedAt.toISOString(),
        due_at: dueAt.toISOString(),
      })
      .select("id")
      .single();
    if (insertError || !invoice) {
      return { ok: false, reason: "internal" };
    }
    const invoiceId = (invoice as { id: string }).id;

    // Flip the candidate approved→invoiced via the guarded write path
    // (the migration extends the lattice with approved→invoiced).
    const { error: reviewError } = await supabase.rpc(
      "review_invoice_candidate",
      {
        p_id: candidateId,
        p_reviewer: null,
        p_new_status: "invoiced",
        p_note: null,
      },
    );
    if (reviewError) {
      console.error("[truedeed] invoice candidate flip failed", {
        candidate_id: candidateId,
        invoice_id: invoiceId,
      });
    }

    await createGoCardlessPayment(supabase, invoiceId, agentId, dueAt);

    await supabase.from("truedeed_audit_log").insert({
      action: "invoice_created",
      entity: "invoices",
      entity_id: invoiceId,
      detail: {
        invoice_candidate_id: candidateId,
        gross_pence: GROSS_PENCE,
        due_at: dueAt.toISOString(),
      },
    });

    await inngest.send({
      name: "truedeed/invoice.created",
      data: { invoiceId },
    });

    return { ok: true, invoiceId, created: true };
  } catch (error: unknown) {
    console.error("[truedeed] createInvoiceFromCandidate failed", {
      error_type: errorType(error),
      candidate_id: candidateId,
    });
    return null;
  }
}

/**
 * Creates the GoCardless Bacs payment for a freshly issued invoice
 * (doc §2.3: charge_date = due date so GC sends the advance notice).
 * When GoCardless is unconfigured, or the org has no mandate, an
 * invoice_events row records the skip instead. Never throws.
 */
async function createGoCardlessPayment(
  supabase: ReturnType<typeof createAdminClient>,
  invoiceId: string,
  agentId: string,
  dueAt: Date,
): Promise<void> {
  if (!isGoCardlessConfigured()) {
    await supabase.from("invoice_events").insert({
      invoice_id: invoiceId,
      event: "gc_not_configured",
    });
    return;
  }

  try {
    const { data: profile } = await supabase
      .from("agent_agency_profiles")
      .select("gocardless_mandate_id")
      .eq("agent_id", agentId)
      .maybeSingle();
    const mandateId = (profile as { gocardless_mandate_id?: string | null } | null)
      ?.gocardless_mandate_id;
    if (!mandateId) {
      await supabase.from("invoice_events").insert({
        invoice_id: invoiceId,
        event: "mandate_missing",
      });
      return;
    }

    const response = await gcRequest<GcPaymentResponse>("/payments", {
      method: "POST",
      body: {
        payments: {
          amount: GROSS_PENCE,
          currency: "GBP",
          charge_date: dueAt.toISOString().slice(0, 10),
          links: { mandate: mandateId },
        },
      },
      idempotencyKey: invoiceId,
    });

    await supabase
      .from("invoices")
      .update({ gocardless_payment_id: response.payments.id })
      .eq("id", invoiceId);
  } catch (error: unknown) {
    console.error("[truedeed] GoCardless payment creation failed", {
      error_type: errorType(error),
      invoice_id: invoiceId,
    });
    await supabase.from("invoice_events").insert({
      invoice_id: invoiceId,
      event: "gc_payment_create_failed",
    });
  }
}

/** Resolves the invoice id behind a GoCardless payment id, or null. */
async function findInvoiceByPaymentId(
  supabase: ReturnType<typeof createAdminClient>,
  gcPaymentId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("gocardless_payment_id", gcPaymentId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

/** Drives the guarded invoice state machine via rpc 'transition_invoice'. */
async function transitionInvoice(
  supabase: ReturnType<typeof createAdminClient>,
  invoiceId: string,
  event: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("transition_invoice", {
    p_id: invoiceId,
    p_event: event,
  });
  return !error;
}

/**
 * GoCardless payments.confirmed: transitions the invoice payment_confirmed
 * and emits 'truedeed/invoice.paid' (reinstatement + email 5). Returns
 * false for unknown payments or failed transitions. Never throws.
 */
export async function recordPaymentConfirmed(
  gcPaymentId: string,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const invoiceId = await findInvoiceByPaymentId(supabase, gcPaymentId);
    if (!invoiceId) return false;

    if (!(await transitionInvoice(supabase, invoiceId, "payment_confirmed"))) {
      return false;
    }
    await inngest.send({
      name: "truedeed/invoice.paid",
      data: { invoiceId },
    });
    return true;
  } catch (error: unknown) {
    console.error("[truedeed] recordPaymentConfirmed failed", {
      error_type: errorType(error),
    });
    return false;
  }
}

/**
 * GoCardless payments.failed: transitions payment_failed and emits
 * 'truedeed/invoice.payment-failed' (email 1, dunning day 0). Never throws.
 */
export async function recordPaymentFailed(
  gcPaymentId: string,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const invoiceId = await findInvoiceByPaymentId(supabase, gcPaymentId);
    if (!invoiceId) return false;

    if (!(await transitionInvoice(supabase, invoiceId, "payment_failed"))) {
      return false;
    }
    await inngest.send({
      name: "truedeed/invoice.payment-failed",
      data: { invoiceId },
    });
    return true;
  } catch (error: unknown) {
    console.error("[truedeed] recordPaymentFailed failed", {
      error_type: errorType(error),
    });
    return false;
  }
}

/**
 * GoCardless payments.charged_back (clause 8.6): transitions charged_back
 * and records event + audit rows. Deliberately NO inngest event and NO
 * billing suspension — a chargeback freezes auto-collection only; recovery
 * is the ops/dispute path. Never throws.
 */
export async function recordChargeback(gcPaymentId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const invoiceId = await findInvoiceByPaymentId(supabase, gcPaymentId);
    if (!invoiceId) return false;

    if (!(await transitionInvoice(supabase, invoiceId, "charged_back"))) {
      return false;
    }
    await supabase.from("invoice_events").insert({
      invoice_id: invoiceId,
      event: "charged_back",
    });
    await supabase.from("truedeed_audit_log").insert({
      action: "invoice_charged_back",
      entity: "invoices",
      entity_id: invoiceId,
      detail: { gocardless_payment_id: gcPaymentId },
    });
    return true;
  } catch (error: unknown) {
    console.error("[truedeed] recordChargeback failed", {
      error_type: errorType(error),
    });
    return false;
  }
}
