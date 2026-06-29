/* eslint-disable no-console -- matches src/services/email/email-service.ts logging convention */
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUserEmailPref, BASE_URL } from "@/services/email/email-service";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";
import { brandUrl, emailFromHeader } from "@/config/brand";
import { Resend } from "resend";
import type { LifecycleRole, LifecycleStep } from "./sequences";

const MARKETING_PREF_KEY = "email_marketing";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[lifecycle-email] RESEND_API_KEY not set — emails will be skipped");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

/**
 * Resolve an absolute CTA URL from an internal path.
 * Sequence hrefs are stored as internal absolute paths (e.g. "/search").
 */
function absoluteUrl(href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  return brandUrl(href);
}

type SendResult = "sent" | "skipped_idempotent" | "skipped_marketing_pref" | "skipped_unsubscribed" | "failed";

/**
 * Has this user globally unsubscribed from email? Delegates to the shared
 * checkUserEmailPref, which honours the durable global-unsub signal
 * (profiles.preferences.digest_frequency === "never") set by the unsubscribe
 * route. Using an unmapped pref key means the result reflects ONLY the global
 * signal — it is true (suppress) only when the user is globally unsubscribed.
 */
async function isGloballyUnsubscribed(userId: string): Promise<boolean> {
  // checkUserEmailPref returns false when globally unsubscribed, true otherwise
  // (an unmapped key has no per-type toggle, so it never suppresses on its own).
  return !(await checkUserEmailPref(userId, "lifecycle_global_unsub_probe"));
}

async function alreadySent(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  role: LifecycleRole,
  stepKey: string,
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("lifecycle_email_sends")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .eq("step_key", stepKey)
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

async function logEmail(params: {
  userId: string;
  template: string;
  recipient: string;
  resendId?: string | null;
  status: "sent" | "failed" | "suppressed";
  suppressionReason?: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("email_logs").insert({
      user_id: params.userId,
      template: params.template,
      recipient: params.recipient,
      resend_id: params.resendId ?? null,
      status: params.status,
      suppression_reason: params.suppressionReason ?? null,
      error_message: params.errorMessage ?? null,
      sent_at: new Date().toISOString(),
    });
  } catch {
    // best-effort — never throws
  }
}

/**
 * Send one lifecycle drip step. Never throws.
 *
 * Gating:
 *   - "marketing" steps require the marketing preference AND are skipped if the
 *     user is globally unsubscribed.
 *   - "onboarding" steps always send (still skipped on a hard global unsub),
 *     and always carry an unsubscribe link.
 *
 * Idempotency: a (user_id, role, step_key) row in lifecycle_email_sends blocks
 * a re-send if Inngest replays the step. The row is inserted after a successful
 * send.
 */
export async function sendLifecycleStep(params: {
  userId: string;
  email: string;
  role: LifecycleRole;
  step: LifecycleStep;
  firstName?: string;
}): Promise<SendResult> {
  const { userId, email, role, step, firstName } = params;
  const template = `lifecycle-${step.key}`;
  const supabase = createAdminClient();

  // Idempotency guard — never double-send the same step.
  if (await alreadySent(supabase, userId, role, step.key)) {
    return "skipped_idempotent";
  }

  // Hard stop: global unsubscribe-all suppresses every step, onboarding included.
  if (await isGloballyUnsubscribed(userId)) {
    await logEmail({
      userId,
      template,
      recipient: email,
      status: "suppressed",
      suppressionReason: "unsubscribed",
    });
    return "skipped_unsubscribed";
  }

  // Marketing steps are preference-gated. Onboarding steps always send.
  if (step.kind === "marketing") {
    const enabled = await checkUserEmailPref(userId, MARKETING_PREF_KEY);
    if (!enabled) {
      await logEmail({
        userId,
        template,
        recipient: email,
        status: "suppressed",
        suppressionReason: "marketing_pref_disabled",
      });
      return "skipped_marketing_pref";
    }
  }

  try {
    const { LifecycleDripEmail } = await import("@/emails/lifecycle-drip");
    const { render } = await import("@react-email/components");
    const unsubscribeUrl = `${BASE_URL}/unsubscribe?token=${generateUnsubscribeToken(userId)}`;

    const html = await render(
      LifecycleDripEmail({
        heading: step.heading,
        paragraphs: step.paragraphs,
        ctaLabel: step.ctaLabel,
        ctaHref: absoluteUrl(step.ctaHref),
        previewText: step.previewText,
        unsubscribeUrl,
        firstName: firstName || undefined,
      }),
    );

    const client = getResend();
    if (!client) {
      await logEmail({
        userId,
        template,
        recipient: email,
        status: "failed",
        errorMessage: "RESEND_API_KEY not set",
      });
      return "failed";
    }

    const { data, error } = await client.emails.send({
      from: emailFromHeader(),
      to: email,
      subject: step.subject,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });

    if (error) throw new Error(error.message);

    // Record the send for idempotency (best-effort; unique constraint also guards).
    try {
      await supabase.from("lifecycle_email_sends").insert({
        user_id: userId,
        role,
        step_key: step.key,
      });
    } catch {
      // unique-violation on a replay race is fine — the email went out once
    }

    await logEmail({
      userId,
      template,
      recipient: email,
      resendId: data?.id ?? null,
      status: "sent",
    });
    return "sent";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId,
      template,
      recipient: email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[lifecycle-email] sendLifecycleStep failed", message);
    return "failed";
  }
}
