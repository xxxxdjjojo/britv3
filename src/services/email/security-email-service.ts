/**
 * Security alert email service.
 * Sends notifications for security-critical account events:
 * password changes, MFA enroll/unenroll, email changes.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = `${process.env.RESEND_FROM_NAME ?? "Britestate"} <${process.env.RESEND_FROM_ADDRESS ?? "hello@britestate.co.uk"}>`;

type SecurityAlertInput = {
  userId: string;
  email: string;
  firstName: string;
  eventType: string;
};

const EVENT_SUBJECTS: Record<string, string> = {
  password_changed: "Your password was changed",
  mfa_enrolled: "Two-factor authentication enabled",
  mfa_unenrolled: "Two-factor authentication disabled",
  email_changed: "Your email address was changed",
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  password_changed: "Your Britestate account password was just changed.",
  mfa_enrolled: "Two-factor authentication was just enabled on your Britestate account.",
  mfa_unenrolled: "Two-factor authentication was just disabled on your Britestate account.",
  email_changed: "The email address on your Britestate account was just changed.",
};

export async function sendSecurityAlert(
  input: SecurityAlertInput,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[security-email] RESEND_API_KEY not set — skipping security alert");
    return;
  }

  const subject = EVENT_SUBJECTS[input.eventType] ?? "Security alert for your account";
  const description = EVENT_DESCRIPTIONS[input.eventType] ?? `A security-related change was made to your Britestate account (${input.eventType}).`;

  try {
    await getResend().emails.send({
      from: FROM,
      to: input.email,
      subject: `${subject} — Britestate`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1B4D3E; margin-bottom: 16px;">Security Alert</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Hi ${input.firstName || "there"},
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            ${description}
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            If you made this change, no action is needed.
          </p>
          <p style="color: #dc2626; font-size: 15px; line-height: 1.6; font-weight: 600;">
            If you did not make this change, please secure your account immediately by resetting your password.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/forgot-password"
             style="display: inline-block; background: #1B4D3E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Reset Password
          </a>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated security notification from Britestate. You cannot unsubscribe from security alerts.
          </p>
        </div>
      `,
    });
  } catch (err) {
    // Log but don't throw — security alerts are fire-and-forget
    console.error("[security-email] Failed to send security alert:", input.eventType, err);
  }
}
