/* eslint-disable no-console -- best-effort send; failures logged, never thrown */
import { Resend } from "resend";
import { appUrl, emailFromHeader } from "@/config/brand";

// Lazy-initialize so the Resend SDK does not throw at module evaluation time
// (during `next build` static collection the env var may be absent).
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[waitlist-email] RESEND_API_KEY not set — email skipped");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export async function sendWaitlistWelcome(params: {
  email: string;
  code: string;
  position: number;
}): Promise<void> {
  try {
    const client = getResend();
    if (!client) return;

    const { WaitlistWelcomeEmail } = await import("@/emails/waitlist-welcome");
    const { render } = await import("@react-email/components");
    const shareUrl = appUrl(`/coming-soon?ref=${params.code}`);
    const html = await render(
      WaitlistWelcomeEmail({ position: params.position, shareUrl }),
    );

    await client.emails.send({
      from: emailFromHeader(),
      to: params.email,
      subject: "You're on the TrueDeed early-access list",
      html,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[waitlist-email] sendWaitlistWelcome failed", message);
  }
}
