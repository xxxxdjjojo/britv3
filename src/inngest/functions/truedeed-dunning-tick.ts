/**
 * Inngest functions: Truedeed dunning tick + invoice creation chain.
 *
 *   truedeed-dunning-tick (cron 08:00 UTC, spec §5 `dunning:tick`):
 *     advance overdue/final_notice invoices by date via
 *     runDunningTick — it emits the reminder / final-notice / suspended
 *     events consumed by truedeed-invoice-emails.ts — then audit the counts.
 *
 *   truedeed-invoice-candidate-approved (spec §2 `billing:create-invoice`):
 *     consume 'truedeed/invoice-candidate.approved' (emitted by the Phase 2
 *     human review gate) → createInvoiceFromCandidate, which raises the VAT
 *     invoice, schedules the GoCardless collection, and emits
 *     'truedeed/invoice.created' (Email 0).
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDunningTick } from "@/services/truedeed/dunning-service";
import { createInvoiceFromCandidate } from "@/services/truedeed/invoice-service";

export const truedeedDunningTick = inngest.createFunction(
  { id: "truedeed-dunning-tick", name: "Truedeed billing: daily dunning tick" },
  { cron: "0 8 * * *" },
  async ({ step }) => {
    const counts = await step.run("run-dunning-tick", () =>
      runDunningTick(new Date()),
    );

    await step.run("audit-counts", async () => {
      const supabase = createAdminClient();
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "dunning_tick",
        entity: "invoice",
        entity_id: null,
        detail: {
          reminders: counts?.reminders ?? 0,
          final_notices: counts?.finalNotices ?? 0,
          suspensions: counts?.suspensions ?? 0,
        },
      });
    });

    return { status: "completed", ...counts };
  },
);

export const truedeedInvoiceCandidateApproved = inngest.createFunction(
  {
    id: "truedeed-invoice-candidate-approved",
    name: "Truedeed billing: create invoice from approved candidate",
  },
  { event: "truedeed/invoice-candidate.approved" },
  async ({ event, step }) => {
    const { candidateId } = event.data as { candidateId: string };

    const result = await step.run("create-invoice", () =>
      createInvoiceFromCandidate(candidateId),
    );

    return { status: result ? "created" : "skipped", candidateId, result };
  },
);
