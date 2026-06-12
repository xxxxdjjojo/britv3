/**
 * Inngest function: Notify the branch/agent when an introduction is recorded.
 *
 * Flow (clause 3.1 — this email is dispute evidence):
 *   1. Fetch introduction + listing address (skip if already notified)
 *   2. Resolve recipient (branch email, else agent email)
 *   3. Compute rebuttal deadline = notified_at + 5 England & Wales business days
 *   4. Render + send the notification email via Resend, log to email_logs
 *   5. mark_introduction_notified RPC (one-shot; tolerate retries)
 *   6. Write platform_events + truedeed_audit_log rows
 */

import { Resend } from "resend";
import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";
import {
  getEnglandWalesBankHolidays,
  addBusinessDays,
} from "@/lib/business-days";

const REBUTTAL_WINDOW_BUSINESS_DAYS = 5;

// Lazy-initialize so the Resend SDK does not throw at module evaluation time.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = `${process.env.RESEND_FROM_NAME ?? "Britestate"} <${process.env.RESEND_FROM_ADDRESS ?? "hello@britestate.co.uk"}>`;

const CONTACT_TYPE_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  viewing_request: "Viewing request",
  message: "Message",
};

const EN_GB_LONG = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/London",
});

type IntroductionRow = {
  id: string;
  applicant_id: string | null;
  applicant_name: string;
  listing_id: string;
  agent_id: string;
  branch_id: string | null;
  first_contact_type: string;
  occurred_at: string;
  notified_at: string | null;
  listings: {
    properties: {
      address_line1: string | null;
      postcode: string | null;
    } | null;
  } | null;
};

export const truedeedNotifyIntroduction = inngest.createFunction(
  {
    id: "truedeed-notify-introduction",
    name: "Notify agent about recorded introduction",
  },
  { event: "truedeed/introduction.recorded" },
  async ({ event, step }) => {
    const { introductionId } = event.data as { introductionId: string };
    const supabase = createAdminClient();

    // Step 1: fetch the introduction with the listing address
    const intro = await step.run("fetch-introduction", async () => {
      const { data, error } = await supabase
        .from("introductions")
        .select(
          "id, applicant_id, applicant_name, listing_id, agent_id, branch_id, first_contact_type, occurred_at, notified_at, listings(properties(address_line1, postcode))",
        )
        .eq("id", introductionId)
        .maybeSingle();

      if (error) {
        captureException(error, {
          module: "truedeed",
          feature: "notify-introduction",
          operation: "fetchIntroduction",
          extra: { introductionId },
        });
        throw new Error(`Failed to fetch introduction ${introductionId}: ${error.message}`);
      }

      return data as unknown as IntroductionRow | null;
    });

    if (!intro) {
      return { status: "not_found", introductionId };
    }
    if (intro.notified_at) {
      return { status: "already_notified", introductionId };
    }

    // Step 2: resolve the recipient — branch email if set, else agent email
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

      const { data: authUser } = await supabase.auth.admin.getUserById(intro.agent_id);
      return authUser?.user?.email ?? null;
    });

    if (!recipient) {
      captureException(
        new Error(`No recipient email for introduction ${introductionId}`),
        {
          module: "truedeed",
          feature: "notify-introduction",
          operation: "resolveRecipient",
          extra: { introductionId, agentId: intro.agent_id, branchId: intro.branch_id },
        },
      );
      return { status: "no_recipient", introductionId };
    }

    // Step 3: compute notified_at + rebuttal deadline (memoized — stable across retries)
    const { notifiedAt, deadline } = await step.run("compute-deadline", async () => {
      const now = new Date();
      const holidays = await getEnglandWalesBankHolidays();
      const rebuttalDeadline = addBusinessDays(
        now,
        REBUTTAL_WINDOW_BUSINESS_DAYS,
        holidays,
      );
      return { notifiedAt: now.toISOString(), deadline: rebuttalDeadline.toISOString() };
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
    const property = intro.listings?.properties;
    const listingAddress = [property?.address_line1, property?.postcode]
      .filter(Boolean)
      .join(", ") || "the listed property";

    // Step 4: send the notification email (throws on failure so Inngest retries)
    await step.run("send-email", async () => {
      try {
        const { default: IntroductionNotification } = await import(
          "@/lib/email/templates/IntroductionNotification"
        );
        const { render } = await import("@react-email/components");
        const html = await render(
          IntroductionNotification({
            applicantName: intro.applicant_name,
            listingAddress,
            introducedAt: EN_GB_LONG.format(new Date(intro.occurred_at)),
            contactTypeLabel:
              CONTACT_TYPE_LABELS[intro.first_contact_type] ?? intro.first_contact_type,
            rebuttalDeadline: EN_GB_LONG.format(new Date(deadline)),
            dashboardUrl: `${appUrl}/dashboard/agent/introductions`,
            introductionId: intro.id,
          }),
        );

        const { data, error } = await getResend().emails.send({
          from: FROM,
          to: recipient,
          subject: `New introduction recorded – ${listingAddress}`,
          html,
        });

        if (error) throw new Error(error.message);

        await supabase.from("email_logs").insert({
          user_id: intro.agent_id,
          template: "introduction_notification",
          recipient,
          resend_id: data?.id ?? null,
          status: "sent",
        });

        return { resendId: data?.id ?? null };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase.from("email_logs").insert({
          user_id: intro.agent_id,
          template: "introduction_notification",
          recipient,
          status: "failed",
          error_message: message,
        });
        captureException(err, {
          module: "truedeed",
          feature: "notify-introduction",
          operation: "sendEmail",
          extra: { introductionId },
        });
        throw err;
      }
    });

    // Step 5: stamp notified_at + rebuttal_deadline (one-shot RPC)
    await step.run("mark-notified", async () => {
      const { error } = await supabase.rpc("mark_introduction_notified", {
        p_id: introductionId,
        p_notified_at: notifiedAt,
        p_deadline: deadline,
      });

      // Idempotent retries: a previous attempt may have already stamped the row.
      if (error && !error.message.includes("already notified")) {
        captureException(error, {
          module: "truedeed",
          feature: "notify-introduction",
          operation: "markNotified",
          extra: { introductionId },
        });
        throw new Error(`mark_introduction_notified failed: ${error.message}`);
      }
    });

    // Step 6: platform event + audit trail
    await step.run("write-events", async () => {
      await supabase.from("platform_events").insert({
        event_type: "introduction_recorded",
        entity_type: "listing",
        entity_id: intro.listing_id,
        // platform_events.actor_id is NOT NULL; applicant may be GDPR-scrubbed
        actor_id: intro.applicant_id ?? intro.agent_id,
        metadata: { introduction_id: intro.id },
      });

      await supabase.from("truedeed_audit_log").insert({
        actor: null,
        action: "introduction_notified",
        entity: "introduction",
        entity_id: intro.id,
        detail: {
          recipient,
          notified_at: notifiedAt,
          rebuttal_deadline: deadline,
        },
      });
    });

    return {
      status: "notified",
      introductionId,
      recipient,
      rebuttalDeadline: deadline,
    };
  },
);
