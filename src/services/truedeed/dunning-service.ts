/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed dunning service (billing spec §2 timeline, §5 — `dunning:tick`,
 * `billing:suspend` / `billing:reinstate`).
 *
 * `runDunningTick(now)` walks invoices in ('overdue', 'final_notice') —
 * never 'disputed' (§2: a dispute freezes that invoice's clock) — and
 * compares daysOverdue (due_at vs `now`) against DUNNING_DAYS from
 * @/lib/truedeed/dunning-machine (never literal day numbers):
 *
 *   final_notice & day >= SUSPEND      → rpc 'transition_invoice' day_tick
 *                                        + 'truedeed/invoice.suspended'
 *   overdue      & day >= FINAL_NOTICE → rpc transition
 *                                        + 'truedeed/invoice.final-notice'
 *   overdue      & day >= REMINDER     → email-only (the machine's D+7
 *                                        self-transition): NO state change;
 *                                        'truedeed/invoice.reminder' + an
 *                                        invoice_events row named by
 *                                        emailForTransition — idempotent via
 *                                        the embedded invoice_events.
 *
 * Per-invoice failures are isolated: the batch continues and the failed
 * invoice is simply not counted.
 *
 * `suspendOrgBilling` / `reinstateOrgBilling` set / clear
 * agent_agency_profiles.billing_suspended_at, write an audit row and emit
 * 'truedeed/billing.suspension-changed' { agentId, suspended }.
 *
 * SECURITY NOTE: Logs carry only error_type (the Error constructor name)
 * and entity ids — never names, emails, addresses or other PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { DUNNING_DAYS, emailForTransition } from "@/lib/truedeed/dunning-machine";

const DAY_MS = 24 * 60 * 60 * 1000;

const TICK_STATES = ["overdue", "final_notice"] as const;

const INVOICE_SELECT =
  "id, state, due_at, org_agent_id, invoice_events ( event )";

export type DunningTickCounts = {
  reminders: number;
  finalNotices: number;
  suspensions: number;
};

type TickInvoiceRow = {
  id: string;
  state: string;
  due_at: string;
  org_agent_id: string;
  invoice_events?: Array<{ event: string }> | null;
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

async function transitionDayTick(
  supabase: ReturnType<typeof createAdminClient>,
  invoiceId: string,
  daysOverdue: number,
): Promise<boolean> {
  const { error } = await supabase.rpc("transition_invoice", {
    p_id: invoiceId,
    p_event: "day_tick",
    p_days_overdue: daysOverdue,
  });
  return !error;
}

/**
 * Daily dunning sweep. Returns the per-bucket counts, or null on top-level
 * failure. Never throws.
 */
export async function runDunningTick(
  now: Date,
): Promise<DunningTickCounts | null> {
  try {
    const supabase = createAdminClient();
    const counts: DunningTickCounts = {
      reminders: 0,
      finalNotices: 0,
      suspensions: 0,
    };

    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_SELECT)
      .in("state", [...TICK_STATES]);
    if (error || !Array.isArray(data)) {
      console.error("[truedeed] dunning tick invoice query failed", {
        error_code: (error as { code?: string } | null)?.code,
      });
      return null;
    }

    for (const invoice of data as unknown as TickInvoiceRow[]) {
      try {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(invoice.due_at).getTime()) / DAY_MS,
        );

        if (
          invoice.state === "final_notice" &&
          daysOverdue >= DUNNING_DAYS.SUSPEND
        ) {
          if (!(await transitionDayTick(supabase, invoice.id, daysOverdue))) {
            continue;
          }
          await inngest.send({
            name: "truedeed/invoice.suspended",
            data: { invoiceId: invoice.id, agentId: invoice.org_agent_id },
          });
          counts.suspensions += 1;
        } else if (
          invoice.state === "overdue" &&
          daysOverdue >= DUNNING_DAYS.FINAL_NOTICE
        ) {
          if (!(await transitionDayTick(supabase, invoice.id, daysOverdue))) {
            continue;
          }
          await inngest.send({
            name: "truedeed/invoice.final-notice",
            data: { invoiceId: invoice.id },
          });
          counts.finalNotices += 1;
        } else if (
          invoice.state === "overdue" &&
          daysOverdue >= DUNNING_DAYS.REMINDER
        ) {
          // Email-only self-transition (D+REMINDER in the machine): the
          // event name comes from emailForTransition, never a literal; the
          // event's daysOverdue is pinned to REMINDER because send-once is
          // enforced by the invoice_events dedupe, not by an exact-day hit.
          const emailEvent = emailForTransition("overdue", "overdue", {
            type: "day_tick",
            daysOverdue: DUNNING_DAYS.REMINDER,
          });
          if (!emailEvent) continue;
          const alreadySent = (invoice.invoice_events ?? []).some(
            (e) => e.event === emailEvent,
          );
          if (alreadySent) continue;

          await inngest.send({
            name: "truedeed/invoice.reminder",
            data: { invoiceId: invoice.id },
          });
          await supabase.from("invoice_events").insert({
            invoice_id: invoice.id,
            event: emailEvent,
          });
          counts.reminders += 1;
        }
      } catch (invoiceError: unknown) {
        console.error("[truedeed] dunning tick invoice failed", {
          error_type: errorType(invoiceError),
          invoice_id: invoice.id,
        });
      }
    }

    return counts;
  } catch (error: unknown) {
    console.error("[truedeed] runDunningTick failed", {
      error_type: errorType(error),
    });
    return null;
  }
}

async function setBillingSuspension(
  agentId: string,
  suspended: boolean,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { error: updateError } = await supabase
      .from("agent_agency_profiles")
      .update({
        billing_suspended_at: suspended ? new Date().toISOString() : null,
      })
      .eq("agent_id", agentId);
    if (updateError) return false;

    await supabase.from("truedeed_audit_log").insert({
      action: suspended ? "billing_suspended" : "billing_reinstated",
      entity: "agent_agency_profiles",
      entity_id: agentId,
      detail: { suspended },
    });

    await inngest.send({
      name: "truedeed/billing.suspension-changed",
      data: { agentId, suspended },
    });

    return true;
  } catch (error: unknown) {
    console.error("[truedeed] billing suspension change failed", {
      error_type: errorType(error),
      agent_id: agentId,
    });
    return false;
  }
}

/**
 * Suspends an org's membership benefits for non-payment (clause 11.1(a)):
 * stamps billing_suspended_at + audit row + suspension-changed event.
 * Never throws.
 */
export async function suspendOrgBilling(agentId: string): Promise<boolean> {
  return setBillingSuspension(agentId, true);
}

/**
 * Reinstates an org after payment (email 5 path): clears
 * billing_suspended_at + audit row + suspension-changed event. Never throws.
 */
export async function reinstateOrgBilling(agentId: string): Promise<boolean> {
  return setBillingSuspension(agentId, false);
}
