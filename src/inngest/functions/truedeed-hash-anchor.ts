/**
 * Inngest cron: Truedeed ledger hash anchor (daily at 6am UTC)
 *
 * Emails the latest introductions row_hash + row count to LEDGER_ANCHOR_EMAIL.
 * The delivery log of this email is an external timestamped anchor for the
 * hash chain — it proves the ledger state at a point in time.
 */

import { Resend } from "resend";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import { brandConfig } from "@/config/brand";

// Lazy-initialize so the Resend SDK does not throw at module evaluation time.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = `${process.env.RESEND_FROM_NAME ?? brandConfig.displayName} <${process.env.RESEND_FROM_ADDRESS ?? brandConfig.fromEmail}>`;

export const truedeedHashAnchor = inngest.createFunction(
  {
    id: "truedeed-hash-anchor",
    name: "Daily Truedeed ledger hash anchor",
  },
  { cron: "0 6 * * *" },
  async ({ step }) => {
    const supabase = createAdminClient();

    const head = await step.run("read-ledger-head", async () => {
      const { count, error: countError } = await supabase
        .from("introductions")
        .select("id", { count: "exact", head: true });

      if (countError) {
        captureException(countError, {
          module: "truedeed",
          feature: "hash-anchor",
          operation: "countIntroductions",
        });
        throw new Error(`Failed to count introductions: ${countError.message}`);
      }

      if (!count) {
        return null;
      }

      const { data, error } = await supabase
        .from("introductions")
        .select("row_hash")
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "hash-anchor",
          operation: "fetchLatestHash",
        });
        throw new Error(`Failed to fetch latest row_hash: ${error.message}`);
      }

      return { rowHash: (data as { row_hash: string }).row_hash, count };
    });

    if (!head) {
      return { status: "empty_ledger", anchored: false };
    }

    const anchorEmail = process.env.LEDGER_ANCHOR_EMAIL;
    if (!anchorEmail) {
      console.warn("[truedeed-hash-anchor] LEDGER_ANCHOR_EMAIL not set -- skipping anchor email");
      return { status: "no_anchor_email", anchored: false };
    }

    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);

    await step.run("send-anchor-email", async () => {
      try {
        const { data, error } = await getResend().emails.send({
          from: FROM,
          to: anchorEmail,
          subject: `Truedeed ledger anchor ${date}`,
          text: [
            "Truedeed introductions ledger anchor",
            "",
            `Timestamp: ${timestamp}`,
            `Row count: ${head.count}`,
            `Latest row_hash: ${head.rowHash}`,
          ].join("\n"),
        });

        if (error) throw new Error(error.message);

        await supabase.from("email_logs").insert({
          user_id: null,
          template: "ledger_anchor",
          recipient: anchorEmail,
          resend_id: data?.id ?? null,
          status: "sent",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase.from("email_logs").insert({
          user_id: null,
          template: "ledger_anchor",
          recipient: anchorEmail,
          status: "failed",
          error_message: message,
        });
        captureException(err, {
          module: "truedeed",
          feature: "hash-anchor",
          operation: "sendAnchorEmail",
        });
        throw err;
      }
    });

    await step.run("write-audit-log", async () => {
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "hash_anchor",
        entity: "introductions",
        entity_id: null,
        detail: { row_hash: head.rowHash, count: head.count, anchored_at: timestamp },
      });
    });

    return {
      status: "anchored",
      anchored: true,
      count: head.count,
      rowHash: head.rowHash,
    };
  },
);
