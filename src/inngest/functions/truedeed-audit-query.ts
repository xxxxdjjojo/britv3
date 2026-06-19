/**
 * Inngest function: send the clause-10.2 audit-query email to the branch.
 *
 * Triggered by "truedeed/audit-query.raised" (emitted by the PPD match
 * service when an audit-mode match scores >= AUDIT_QUERY). The match row is
 * already 'branch_queried' and the invoice candidate already
 * 'on_hold_branch_query' with hold_expires_at set — this job only delivers
 * the question (dispute playbook D3: the query goes first by design, never
 * an invoice).
 *
 * Flow:
 *   1. Fetch match + PPD transaction + introduction + listing address
 *   2. Resolve recipient (branch email, else agent email — Phase 1 pattern)
 *   3. Render + send the AuditQueryNotice email via Resend, log to email_logs
 *   4. Write the truedeed_audit_log 'audit_query_sent' row
 */

import { Resend } from "resend";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import { brandConfig, appBaseUrl } from "@/config/brand";

// Lazy-initialize so the Resend SDK does not throw at module evaluation time.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = `${process.env.RESEND_FROM_NAME ?? brandConfig.displayName} <${process.env.RESEND_FROM_ADDRESS ?? brandConfig.fromEmail}>`;

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "Europe/London",
});

const EN_GB_DATETIME = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/London",
});

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

type MatchRow = {
  id: string;
  ppd_tuid: string;
  listing_id: string;
  introduction_id: string | null;
  status: string;
  ppd_transactions: {
    price_pence: number;
    transfer_date: string;
    postcode: string | null;
    paon: string | null;
    saon: string | null;
    street: string | null;
    town: string | null;
  } | null;
};

type IntroductionRow = {
  id: string;
  applicant_name: string;
  agent_id: string;
  branch_id: string | null;
  occurred_at: string;
};

/** PPD address line: SAON, PAON, street, town, postcode — present parts only. */
function formatPpdAddress(
  ppd: NonNullable<MatchRow["ppd_transactions"]>,
): string {
  return (
    [ppd.saon, ppd.paon, ppd.street, ppd.town, ppd.postcode]
      .filter(Boolean)
      .join(", ") || "the completed property"
  );
}

export const truedeedAuditQuery = inngest.createFunction(
  {
    id: "truedeed-audit-query",
    name: "Send clause-10.2 audit query to branch",
    retries: 3,
  },
  { event: "truedeed/audit-query.raised" },
  async ({ event, step }) => {
    const { matchId, introductionId, listingId } = event.data as {
      matchId: string;
      introductionId: string;
      listingId: string;
    };
    const supabase = createAdminClient();

    // Step 1a: fetch the match candidate with its PPD transaction
    const match = await step.run("fetch-match", async () => {
      const { data, error } = await supabase
        .from("ppd_match_candidates")
        .select(
          "id, ppd_tuid, listing_id, introduction_id, status, ppd_transactions(price_pence, transfer_date, postcode, paon, saon, street, town)",
        )
        .eq("id", matchId)
        .maybeSingle();

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "audit-query",
          operation: "fetchMatch",
          extra: { matchId },
        });
        throw new Error(`Failed to fetch match ${matchId}: ${error.message}`);
      }

      return data as unknown as MatchRow | null;
    });

    if (!match || !match.ppd_transactions) {
      return { status: "not_found", matchId };
    }

    // Step 1b: fetch the introduction (applicant + recipient routing)
    const intro = await step.run("fetch-introduction", async () => {
      const { data, error } = await supabase
        .from("introductions")
        .select("id, applicant_name, agent_id, branch_id, occurred_at")
        .eq("id", introductionId)
        .maybeSingle();

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "audit-query",
          operation: "fetchIntroduction",
          extra: { matchId, introductionId },
        });
        throw new Error(
          `Failed to fetch introduction ${introductionId}: ${error.message}`,
        );
      }

      return data as unknown as IntroductionRow | null;
    });

    if (!intro) {
      return { status: "introduction_not_found", matchId, introductionId };
    }

    // Step 2: resolve the recipient — branch email if set, else agent email
    // (Phase 1 recipient resolution, truedeed-notify-introduction).
    const recipient = await step.run("resolve-recipient", async () => {
      if (intro.branch_id) {
        const { data: branch } = await supabase
          .from("agent_branches")
          .select("email")
          .eq("id", intro.branch_id)
          .maybeSingle();
        const branchEmail = (branch as { email: string | null } | null)?.email;
        if (branchEmail) return branchEmail;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", intro.agent_id)
        .maybeSingle();
      const profileEmail = (profile as { email: string | null } | null)?.email;
      if (profileEmail) return profileEmail;

      const { data: authUser } = await supabase.auth.admin.getUserById(
        intro.agent_id,
      );
      return authUser?.user?.email ?? null;
    });

    if (!recipient) {
      captureException(
        new Error(`No recipient email for audit query ${matchId}`),
        {
          module: "truedeed",
          feature: "audit-query",
          operation: "resolveRecipient",
          extra: { matchId, agentId: intro.agent_id, branchId: intro.branch_id },
        },
      );
      return { status: "no_recipient", matchId };
    }

    const appUrl = appBaseUrl();
    const ppd = match.ppd_transactions;
    const ppdAddress = formatPpdAddress(ppd);
    const completionDate = EN_GB_DATE.format(
      new Date(`${ppd.transfer_date}T00:00:00Z`),
    );
    const pricePaid = GBP.format(ppd.price_pence / 100);

    // Step 3: send the audit-query email (throws on failure so Inngest retries)
    await step.run("send-email", async () => {
      try {
        const { default: AuditQueryNotice } = await import(
          "@/lib/email/templates/AuditQueryNotice"
        );
        const { render } = await import("@react-email/components");
        const html = await render(
          AuditQueryNotice({
            ppdAddress,
            completionDate,
            pricePaid,
            applicantName: intro.applicant_name,
            firstContactDate: EN_GB_DATETIME.format(new Date(intro.occurred_at)),
            dashboardUrl: `${appUrl}/dashboard/agent/introductions`,
            matchId: match.id,
          }),
        );

        const { data, error } = await getResend().emails.send({
          from: FROM,
          to: recipient,
          subject: `Buyer confirmation requested – ${ppdAddress}`,
          html,
        });

        if (error) throw new Error(error.message);

        await supabase.from("email_logs").insert({
          user_id: intro.agent_id,
          template: "audit_query_notice",
          recipient,
          resend_id: data?.id ?? null,
          status: "sent",
        });

        return { resendId: data?.id ?? null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase.from("email_logs").insert({
          user_id: intro.agent_id,
          template: "audit_query_notice",
          recipient,
          status: "failed",
          error_message: message,
        });
        captureException(err, {
          module: "truedeed",
          feature: "audit-query",
          operation: "sendEmail",
          extra: { matchId },
        });
        throw err;
      }
    });

    // Step 4: audit trail. The match row stays 'branch_queried' (already set
    // by the match service) — no status change here.
    await step.run("write-audit-log", async () => {
      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "audit_query_sent",
        entity: "ppd_match_candidate",
        entity_id: match.id,
        detail: {
          recipient,
          introduction_id: introductionId,
          listing_id: listingId,
          ppd_tuid: match.ppd_tuid,
          transfer_date: ppd.transfer_date,
        },
      });
    });

    return { status: "sent", matchId, recipient };
  },
);
