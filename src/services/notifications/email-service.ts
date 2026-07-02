/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Email service -- preference-aware dispatch with rate limiting.
 * Critical events send immediately; non-critical events batch into daily digest.
 */

import { Resend } from "resend";
import { appUrl, brandConfig, emailFromHeader } from "@/config/brand";
import { createRateLimiter } from "@/lib/cache/redis";
import type {
  EventType,
  NotificationPreferences,
  PlatformEvent,
} from "@/types/notifications";
import { CRITICAL_EVENTS } from "./notification-service";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email-service] RESEND_API_KEY not set -- emails disabled");
    return null;
  }

  _resend = new Resend(apiKey);
  return _resend;
}

// ---------------------------------------------------------------------------
// Rate limiter (5 emails per hour per recipient)
// ---------------------------------------------------------------------------

const emailRateLimiter = createRateLimiter(5, "1 h");

// ---------------------------------------------------------------------------
// Preference checks
// ---------------------------------------------------------------------------

/**
 * Check whether an email should be sent for a given event type,
 * respecting the user's per-type preferences and quiet hours.
 */
export function shouldSendEmail(
  preferences: NotificationPreferences,
  eventType: EventType,
): boolean {
  // Check per-type email preference
  const typePrefs = preferences.per_type[eventType];
  if (typePrefs && !typePrefs.email) return false;

  // If no explicit preference, default: critical events send email
  if (!typePrefs) {
    return CRITICAL_EVENTS.has(eventType);
  }

  // Check quiet hours
  if (preferences.quiet_hours.enabled) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const { start, end } = preferences.quiet_hours;

    // Handle overnight quiet hours (e.g., 22:00 -> 07:00)
    if (start > end) {
      if (currentTime >= start || currentTime < end) return false;
    } else {
      if (currentTime >= start && currentTime < end) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Critical email dispatch
// ---------------------------------------------------------------------------

const FROM_ADDRESS = emailFromHeader();

export type SendEmailResult = Readonly<{
  sent: boolean;
  rateLimited?: boolean;
  error?: string;
}>;

/**
 * Send a critical (immediate) email notification.
 * Rate limited to 5 per hour per recipient email.
 */
export async function sendCriticalEmail(
  to: string,
  subject: string,
  event: PlatformEvent,
): Promise<SendEmailResult> {
  // Rate limit check
  const { success } = await emailRateLimiter.limit(to);
  if (!success) {
    return { sent: false, rateLimited: true };
  }

  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "Email service not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html: renderCriticalEmailHtml(event),
    });

    return { sent: true };
  } catch (err) {
    console.error("[email-service] Failed to send critical email:", err);
    return { sent: false, error: "Send failed" };
  }
}

// ---------------------------------------------------------------------------
// Provider RFQ lead email (Inngest fallback)
// ---------------------------------------------------------------------------

/**
 * Notify a provider of an unread RFQ lead by email. Sent by the Inngest
 * fallback when the in-app notification has gone unread for an hour.
 * Rate limited to 5 per hour per recipient email.
 */
export async function sendProviderRfqEmail(
  to: string,
  rfqTitle: string,
  isDirect: boolean,
): Promise<SendEmailResult> {
  // Rate limit check
  const { success } = await emailRateLimiter.limit(to);
  if (!success) {
    return { sent: false, rateLimited: true };
  }

  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "Email service not configured" };
  }

  const subject = isDirect
    ? `You've received a direct quote request - ${brandConfig.displayName}`
    : `New job lead matching your services - ${brandConfig.displayName}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html: renderProviderRfqEmailHtml(rfqTitle, isDirect),
    });

    return { sent: true };
  } catch (err) {
    console.error("[email-service] Failed to send provider RFQ email:", err);
    return { sent: false, error: "Send failed" };
  }
}

// ---------------------------------------------------------------------------
// Guest quote email (guest RFQs have no account/dashboard)
// ---------------------------------------------------------------------------

/**
 * Notify a GUEST (logged-out) requester that a quote has arrived on their RFQ.
 * Unlike the critical email, guests cannot open the dashboard, so the email
 * carries the quote amount inline plus a sign-up nudge.
 * Rate limited to 5 per hour per recipient email.
 */
export async function sendGuestQuoteEmail(
  to: string,
  subject: string,
  event: PlatformEvent,
): Promise<SendEmailResult> {
  // Rate limit check
  const { success } = await emailRateLimiter.limit(to);
  if (!success) {
    return { sent: false, rateLimited: true };
  }

  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "Email service not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html: renderGuestQuoteEmailHtml(event),
    });

    return { sent: true };
  } catch (err) {
    console.error("[email-service] Failed to send guest quote email:", err);
    return { sent: false, error: "Send failed" };
  }
}

// ---------------------------------------------------------------------------
// Daily digest dispatch
// ---------------------------------------------------------------------------

/**
 * Send a daily digest email summarizing recent events.
 * Called from the cron route, not from real-time event creation.
 */
export async function sendDailyDigest(
  to: string,
  recipientName: string,
  events: PlatformEvent[],
): Promise<SendEmailResult> {
  if (events.length === 0) {
    return { sent: false, error: "No events to digest" };
  }

  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "Email service not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your daily digest - ${events.length} update${events.length === 1 ? "" : "s"} on ${brandConfig.displayName}`,
      html: renderDailyDigestHtml(recipientName, events),
    });

    return { sent: true };
  } catch (err) {
    console.error("[email-service] Failed to send daily digest:", err);
    return { sent: false, error: "Send failed" };
  }
}

// ---------------------------------------------------------------------------
// HTML renderers (inline templates for server-side rendering)
// ---------------------------------------------------------------------------

function renderCriticalEmailHtml(event: PlatformEvent): string {
  const actor = event.actor_name ?? "Someone";
  const { title, cta } = getEventContent(event);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background-color:#1B4D3E;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">${brandConfig.displayName}</h1>
  </div>
  <div style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#333;margin:0 0 8px 0;font-weight:600;">${title}</p>
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;">from ${actor}</p>
    <a href="${cta.url}" style="display:inline-block;background-color:#1B4D3E;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">
      ${cta.label}
    </a>
  </div>
  <p style="text-align:center;font-size:12px;color:#999;margin-top:16px;">
    You received this email because of your notification preferences on ${brandConfig.displayName}.
  </p>
</div>
</body>
</html>`;
}

/** Escape user-supplied text for interpolation into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderProviderRfqEmailHtml(rfqTitle: string, isDirect: boolean): string {
  const heading = isDirect
    ? "A customer chose you specifically for this job"
    : "A new quote request matches your services";
  const leadsUrl = appUrl("/dashboard/provider/jobs/leads");
  const safeTitle = escapeHtml(rfqTitle);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background-color:#1B4D3E;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">${brandConfig.displayName}</h1>
  </div>
  <div style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#333;margin:0 0 8px 0;font-weight:600;">${heading}</p>
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;">&ldquo;${safeTitle}&rdquo; &mdash; respond with a quote to win the job.</p>
    <a href="${leadsUrl}" style="display:inline-block;background-color:#1B4D3E;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">
      View lead
    </a>
  </div>
  <p style="text-align:center;font-size:12px;color:#999;margin-top:16px;">
    You received this email because of your notification preferences on ${brandConfig.displayName}.
  </p>
</div>
</body>
</html>`;
}

function renderGuestQuoteEmailHtml(event: PlatformEvent): string {
  // Actor name is the provider's display name — provider-controllable text.
  const actor = escapeHtml(event.actor_name ?? "A tradesperson");
  const rawAmount = event.metadata["total_amount"];
  const amountLine =
    typeof rawAmount === "number" && Number.isFinite(rawAmount)
      ? `<p style="font-size:22px;color:#1B4D3E;margin:0 0 24px 0;font-weight:700;">&pound;${rawAmount.toLocaleString("en-GB")}</p>`
      : "";
  const signupUrl = appUrl("/signup");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background-color:#1B4D3E;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">${brandConfig.displayName}</h1>
  </div>
  <div style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#333;margin:0 0 8px 0;font-weight:600;">You received a new quote</p>
    <p style="font-size:14px;color:#666;margin:0 0 8px 0;">from ${actor}</p>
    ${amountLine}
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;">Create a free ${brandConfig.displayName} account to review the full quote, message ${actor}, and track your request.</p>
    <a href="${signupUrl}" style="display:inline-block;background-color:#1B4D3E;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">
      Sign up free
    </a>
  </div>
  <p style="text-align:center;font-size:12px;color:#999;margin-top:16px;">
    You received this email because you requested a quote on ${brandConfig.displayName}.
  </p>
</div>
</body>
</html>`;
}

function renderDailyDigestHtml(
  recipientName: string,
  events: PlatformEvent[],
): string {
  const eventListHtml = events
    .slice(0, 20) // Cap at 20 items in digest
    .map((event) => {
      const { title } = getEventContent(event);
      const actor = event.actor_name ?? "Someone";
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          <p style="margin:0;font-size:14px;color:#333;font-weight:500;">${title}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#888;">${actor} &middot; ${new Date(event.created_at).toLocaleString()}</p>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background-color:#1B4D3E;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">${brandConfig.displayName}</h1>
  </div>
  <div style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#333;margin:0 0 4px 0;">Hi ${recipientName},</p>
    <p style="font-size:14px;color:#666;margin:0 0 24px 0;">Here is your daily summary of ${events.length} update${events.length === 1 ? "" : "s"}:</p>
    <table style="width:100%;border-collapse:collapse;">
      ${eventListHtml}
    </table>
    <div style="margin-top:24px;text-align:center;">
      <a href="${appUrl("/notifications")}" style="display:inline-block;background-color:#1B4D3E;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">
        View all on ${brandConfig.displayName}
      </a>
    </div>
  </div>
  <p style="text-align:center;font-size:12px;color:#999;margin-top:16px;">
    You received this digest because of your notification preferences on ${brandConfig.displayName}.
  </p>
</div>
</body>
</html>`;
}

function getEventContent(event: PlatformEvent): {
  title: string;
  cta: { label: string; url: string };
} {
  const baseUrl = appUrl();

  switch (event.event_type) {
    case "new_message":
      return {
        title: "New message received",
        cta: { label: "View conversation", url: `${baseUrl}/messages/${event.entity_id}` },
      };
    case "quote_received":
      // entity_id is the RFQ id — /quotes/[id] does not exist as a route.
      return {
        title: "You received a new quote",
        cta: {
          label: "View quote",
          url: `${baseUrl}/dashboard/rfqs/${event.entity_id}`,
        },
      };
    case "quote_sent":
      return {
        title: "Your quote was sent",
        cta: { label: "View quote", url: `${baseUrl}/quotes/${event.entity_id}` },
      };
    case "booking_confirmed":
      return {
        title: "Booking confirmed",
        cta: { label: "View booking", url: `${baseUrl}/bookings/${event.entity_id}` },
      };
    case "booking_updated":
      return {
        title: "Booking updated",
        cta: { label: "View booking", url: `${baseUrl}/bookings/${event.entity_id}` },
      };
    case "milestone_updated":
      return {
        title: "Milestone progress updated",
        cta: { label: "View milestones", url: `${baseUrl}/transactions/${event.entity_id}` },
      };
    case "offer_received":
      return {
        title: "You received a new offer",
        cta: { label: "View offer", url: `${baseUrl}/listings/${event.entity_id}` },
      };
    case "viewing_scheduled":
      return {
        title: "Viewing scheduled",
        cta: { label: "View details", url: `${baseUrl}/listings/${event.entity_id}` },
      };
    case "review_posted":
      return {
        title: "New review posted",
        cta: { label: "View review", url: `${baseUrl}/reviews` },
      };
    case "maintenance_request_created":
      return {
        title: "New maintenance request submitted",
        cta: { label: "View request", url: `${baseUrl}/dashboard/landlord/maintenance` },
      };
    default:
      return {
        title: "New notification",
        cta: { label: `View on ${brandConfig.displayName}`, url: `${baseUrl}/notifications` },
      };
  }
}
