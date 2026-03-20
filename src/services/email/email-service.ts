import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import type {
  PropertyAlertEmailProps,
  WeeklyDigestEmailProps,
  ReEngagementEmailProps,
} from "@/types/email";

// Lazy-initialize so the Resend SDK does not throw at module evaluation time
// (during `next build` static page collection the env var may be absent).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = `${process.env.RESEND_FROM_NAME ?? "Britestate"} <${process.env.RESEND_FROM_ADDRESS ?? "hello@britestate.co.uk"}>`;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function resendSend(payload: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
    try {
      const result = await getResend().emails.send(payload);
      if (result.error) {
        const statusCode = (result.error as { statusCode?: number }).statusCode;
        if (statusCode === 422) return result; // don't retry invalid address
        if (attempt < 2) {
          lastError = new Error(result.error.message);
          continue;
        }
      }
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) continue;
    }
  }
  return { data: null, error: lastError };
}

type EmailStatus = "sent" | "failed" | "suppressed";

interface LogEmailParams {
  userId: string;
  template: string;
  recipient: string;
  resendId?: string | null;
  status: EmailStatus;
  suppressionReason?: string;
  errorMessage?: string;
}

async function logEmail(params: LogEmailParams): Promise<void> {
  try {
    const supabase = await createClient();
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

async function checkUserEmailPref(userId: string, prefKey: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notification_preferences")
      .select(prefKey)
      .eq("user_id", userId)
      .single();
    if (error || !data) return true; // default to enabled if no record
    return (data as unknown as Record<string, unknown>)[prefKey] !== false;
  } catch {
    return true; // default to enabled on error
  }
}

// ---------------------------------------------------------------------------
// 1. Welcome
// ---------------------------------------------------------------------------

export async function sendWelcome(params: {
  userId: string;
  email: string;
  firstName: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_marketing");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "welcome",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { WelcomeEmail } = await import("@/emails/welcome");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(WelcomeEmail({ firstName: name }));

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Welcome to Britestate, ${name}!`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "welcome",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "welcome",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendWelcome failed", message);
  }
}

// ---------------------------------------------------------------------------
// 2. Verification (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendVerification(params: {
  userId: string;
  email: string;
  firstName: string;
  verificationUrl: string;
}): Promise<void> {
  try {
    const { VerificationEmail } = await import("@/emails/verification");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      VerificationEmail({ firstName: name, verificationUrl: params.verificationUrl })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Verify your Britestate email address",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "verification",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "verification",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendVerification failed", message);
  }
}

// ---------------------------------------------------------------------------
// 3. Password Reset (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendPasswordReset(params: {
  userId: string;
  email: string;
  firstName: string;
  resetUrl: string;
}): Promise<void> {
  try {
    const { PasswordResetEmail } = await import("@/emails/password-reset");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      PasswordResetEmail({ firstName: name, resetUrl: params.resetUrl })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Reset your Britestate password",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "password-reset",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "password-reset",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendPasswordReset failed", message);
  }
}

// ---------------------------------------------------------------------------
// 4. Property Alert
// ---------------------------------------------------------------------------

export async function sendPropertyAlert(params: {
  userId: string;
  email: string;
  firstName: string;
  searchName: string;
  matchingProperties: PropertyAlertEmailProps["matchingProperties"];
  manageAlertsUrl: string;
}): Promise<void> {
  if (params.matchingProperties.length === 0) {
    await logEmail({
      userId: params.userId,
      template: "property-alert",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "no_content",
    });
    return;
  }

  const enabled = await checkUserEmailPref(params.userId, "email_property_alerts");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "property-alert",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { PropertyAlertEmail } = await import("@/emails/property-alert");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      PropertyAlertEmail({
        firstName: name,
        searchName: params.searchName,
        matchingProperties: params.matchingProperties,
        manageAlertsUrl: params.manageAlertsUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `New properties matching "${params.searchName}"`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "property-alert",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "property-alert",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendPropertyAlert failed", message);
  }
}

// ---------------------------------------------------------------------------
// 5. Viewing Confirmation
// ---------------------------------------------------------------------------

export async function sendViewingConfirmation(params: {
  userId: string;
  email: string;
  firstName: string;
  propertyAddress: string;
  viewingDate: string;
  viewingTime: string;
  agentName: string;
  propertyUrl: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_viewing_reminders");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "viewing-confirmation",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { ViewingConfirmationEmail } = await import("@/emails/viewing-confirmation");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      ViewingConfirmationEmail({
        firstName: name,
        propertyAddress: params.propertyAddress,
        viewingDate: params.viewingDate,
        viewingTime: params.viewingTime,
        agentName: params.agentName,
        propertyUrl: params.propertyUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Viewing confirmed – ${params.propertyAddress}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "viewing-confirmation",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "viewing-confirmation",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendViewingConfirmation failed", message);
  }
}

// ---------------------------------------------------------------------------
// 6. Viewing Reminder
// ---------------------------------------------------------------------------

export async function sendViewingReminder(params: {
  userId: string;
  email: string;
  firstName: string;
  propertyAddress: string;
  viewingDate: string;
  viewingTime: string;
  agentName: string;
  propertyUrl: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_viewing_reminders");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "viewing-reminder",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { ViewingReminderEmail } = await import("@/emails/viewing-reminder");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      ViewingReminderEmail({
        firstName: name,
        propertyAddress: params.propertyAddress,
        viewingDate: params.viewingDate,
        viewingTime: params.viewingTime,
        agentName: params.agentName,
        propertyUrl: params.propertyUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Reminder: Viewing tomorrow – ${params.propertyAddress}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "viewing-reminder",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "viewing-reminder",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendViewingReminder failed", message);
  }
}

// ---------------------------------------------------------------------------
// 7. Offer Received
// ---------------------------------------------------------------------------

export async function sendOfferReceived(params: {
  userId: string;
  email: string;
  agentFirstName: string;
  propertyAddress: string;
  offerAmount: number;
  buyerName: string;
  submittedAt: string;
  dashboardUrl: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_offers");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "offer-received",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { OfferReceivedEmail } = await import("@/emails/offer-received");
    const { render } = await import("@react-email/components");
    const name = params.agentFirstName || "there";
    const html = await render(
      OfferReceivedEmail({
        agentFirstName: name,
        propertyAddress: params.propertyAddress,
        offerAmount: params.offerAmount,
        buyerName: params.buyerName,
        submittedAt: params.submittedAt,
        dashboardUrl: params.dashboardUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `New offer received – ${params.propertyAddress}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "offer-received",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "offer-received",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendOfferReceived failed", message);
  }
}

// ---------------------------------------------------------------------------
// 8. Offer Status
// ---------------------------------------------------------------------------

export async function sendOfferStatus(params: {
  userId: string;
  email: string;
  firstName: string;
  propertyAddress: string;
  offerAmount: number;
  status: "accepted" | "rejected";
  message?: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_offers");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "offer-status",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { OfferStatusEmail } = await import("@/emails/offer-status");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      OfferStatusEmail({
        firstName: name,
        propertyAddress: params.propertyAddress,
        offerAmount: params.offerAmount,
        status: params.status,
        message: params.message,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Your offer on ${params.propertyAddress} has been ${params.status}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "offer-status",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "offer-status",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendOfferStatus failed", message);
  }
}

// ---------------------------------------------------------------------------
// 9. New Enquiry
// ---------------------------------------------------------------------------

export async function sendNewEnquiry(params: {
  userId: string;
  email: string;
  providerFirstName: string;
  enquirerName: string;
  enquirerEmail: string;
  serviceType: string;
  message: string;
  dashboardUrl: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_enquiries");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "new-enquiry",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { NewEnquiryEmail } = await import("@/emails/new-enquiry");
    const { render } = await import("@react-email/components");
    const name = params.providerFirstName || "there";
    const html = await render(
      NewEnquiryEmail({
        providerFirstName: name,
        enquirerName: params.enquirerName,
        enquirerEmail: params.enquirerEmail,
        serviceType: params.serviceType,
        message: params.message,
        dashboardUrl: params.dashboardUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `New enquiry from ${params.enquirerName}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "new-enquiry",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "new-enquiry",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendNewEnquiry failed", message);
  }
}

// ---------------------------------------------------------------------------
// 10. Review Received
// ---------------------------------------------------------------------------

export async function sendReviewReceived(params: {
  userId: string;
  email: string;
  recipientFirstName: string;
  reviewerName: string;
  rating: number;
  reviewUrl: string;
  comment?: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_reviews");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "review-received",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { ReviewReceivedEmail } = await import("@/emails/review-received");
    const { render } = await import("@react-email/components");
    const name = params.recipientFirstName || "there";
    const html = await render(
      ReviewReceivedEmail({
        recipientFirstName: name,
        reviewerName: params.reviewerName,
        rating: params.rating,
        reviewUrl: params.reviewUrl,
        comment: params.comment,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `You received a ${params.rating}-star review from ${params.reviewerName}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "review-received",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "review-received",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendReviewReceived failed", message);
  }
}

// ---------------------------------------------------------------------------
// 11. Compliance Warning (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendComplianceWarning(params: {
  userId: string;
  email: string;
  firstName: string;
  documentName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  uploadUrl: string;
}): Promise<void> {
  try {
    const { ComplianceWarningEmail } = await import("@/emails/compliance-warning");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      ComplianceWarningEmail({
        firstName: name,
        documentName: params.documentName,
        expiryDate: params.expiryDate,
        daysUntilExpiry: params.daysUntilExpiry,
        uploadUrl: params.uploadUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Action required: "${params.documentName}" expires in ${params.daysUntilExpiry} days`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "compliance-warning",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "compliance-warning",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendComplianceWarning failed", message);
  }
}

// ---------------------------------------------------------------------------
// 12. Payment Confirmation (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendPaymentConfirmation(params: {
  userId: string;
  email: string;
  firstName: string;
  amount: number;
  description: string;
  transactionId: string;
  paidAt: string;
}): Promise<void> {
  try {
    const { PaymentConfirmationEmail } = await import("@/emails/payment-confirmation");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      PaymentConfirmationEmail({
        firstName: name,
        amount: params.amount,
        description: params.description,
        transactionId: params.transactionId,
        paidAt: params.paidAt,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Payment confirmed – Britestate",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "payment-confirmation",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "payment-confirmation",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendPaymentConfirmation failed", message);
  }
}

// ---------------------------------------------------------------------------
// 13. Payment Failed (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendPaymentFailed(params: {
  userId: string;
  email: string;
  firstName: string;
  amount: number;
  description: string;
  failedAt: string;
  retryUrl: string;
}): Promise<void> {
  try {
    const { PaymentFailedEmail } = await import("@/emails/payment-failed");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      PaymentFailedEmail({
        firstName: name,
        amount: params.amount,
        description: params.description,
        failedAt: params.failedAt,
        retryUrl: params.retryUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Payment failed – action required",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "payment-failed",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "payment-failed",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendPaymentFailed failed", message);
  }
}

// ---------------------------------------------------------------------------
// 14. Renewal Reminder
// ---------------------------------------------------------------------------

export async function sendRenewalReminder(params: {
  userId: string;
  email: string;
  firstName: string;
  planName: string;
  renewalDate: string;
  amount: number;
  manageSubscriptionUrl: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_billing");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "renewal-reminder",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { RenewalReminderEmail } = await import("@/emails/renewal-reminder");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      RenewalReminderEmail({
        firstName: name,
        planName: params.planName,
        renewalDate: params.renewalDate,
        amount: params.amount,
        manageSubscriptionUrl: params.manageSubscriptionUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Your ${params.planName} plan renews on ${params.renewalDate}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "renewal-reminder",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "renewal-reminder",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendRenewalReminder failed", message);
  }
}

// ---------------------------------------------------------------------------
// 15. Weekly Digest
// ---------------------------------------------------------------------------

export async function sendWeeklyDigest(params: {
  userId: string;
  email: string;
  firstName: string;
  weekStarting: string;
  savedSearchResults: WeeklyDigestEmailProps["savedSearchResults"];
  upcomingViewings: WeeklyDigestEmailProps["upcomingViewings"];
  unreadMessages: number;
  dashboardUrl: string;
}): Promise<void> {
  const hasContent =
    params.savedSearchResults.length > 0 ||
    params.upcomingViewings.length > 0 ||
    params.unreadMessages > 0;

  if (!hasContent) {
    await logEmail({
      userId: params.userId,
      template: "weekly-digest",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "no_content",
    });
    return;
  }

  const enabled = await checkUserEmailPref(params.userId, "email_digest");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "weekly-digest",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { WeeklyDigestEmail } = await import("@/emails/weekly-digest");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      WeeklyDigestEmail({
        firstName: name,
        weekStarting: params.weekStarting,
        savedSearchResults: params.savedSearchResults,
        upcomingViewings: params.upcomingViewings,
        unreadMessages: params.unreadMessages,
        dashboardUrl: params.dashboardUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `Your Britestate weekly digest – w/c ${params.weekStarting}`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "weekly-digest",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "weekly-digest",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendWeeklyDigest failed", message);
  }
}

// ---------------------------------------------------------------------------
// 16. Account Deletion (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendAccountDeletion(params: {
  userId: string;
  email: string;
  firstName: string;
  deletedAt: string;
  dataRetentionDays: number;
}): Promise<void> {
  try {
    const { AccountDeletionEmail } = await import("@/emails/account-deletion");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      AccountDeletionEmail({
        firstName: name,
        deletedAt: params.deletedAt,
        dataRetentionDays: params.dataRetentionDays,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Your Britestate account has been deleted",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "account-deletion",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "account-deletion",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendAccountDeletion failed", message);
  }
}

// ---------------------------------------------------------------------------
// 17. Referral Invitation
// ---------------------------------------------------------------------------

export async function sendReferralInvitation(params: {
  userId: string;
  email: string;
  referrerName: string;
  recipientEmail: string;
  inviteUrl: string;
}): Promise<void> {
  const enabled = await checkUserEmailPref(params.userId, "email_marketing");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "referral-invitation",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { ReferralInvitationEmail } = await import("@/emails/referral-invitation");
    const { render } = await import("@react-email/components");
    const html = await render(
      ReferralInvitationEmail({
        referrerName: params.referrerName,
        recipientEmail: params.recipientEmail,
        inviteUrl: params.inviteUrl,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `${params.referrerName} invited you to Britestate`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "referral-invitation",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "referral-invitation",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendReferralInvitation failed", message);
  }
}

// ---------------------------------------------------------------------------
// 18. Re-engagement (with 7-day deduplication)
// ---------------------------------------------------------------------------

export async function sendReEngagement(params: {
  userId: string;
  email: string;
  firstName: string;
  lastActiveDate: string;
  featuredProperties: ReEngagementEmailProps["featuredProperties"];
  loginUrl: string;
}): Promise<void> {
  // Deduplication: check for a recent re-engagement send in the last 7 days
  try {
    const supabase = await createClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSend } = await supabase
      .from("email_logs")
      .select("id")
      .eq("user_id", params.userId)
      .eq("template", "re-engagement")
      .eq("status", "sent")
      .gte("sent_at", sevenDaysAgo)
      .limit(1)
      .maybeSingle();

    if (recentSend) {
      await logEmail({
        userId: params.userId,
        template: "re-engagement",
        recipient: params.email,
        status: "suppressed",
        suppressionReason: "deduplicated",
      });
      return;
    }
  } catch {
    // if dedup check fails, allow send to proceed
  }

  const enabled = await checkUserEmailPref(params.userId, "email_marketing");
  if (!enabled) {
    await logEmail({
      userId: params.userId,
      template: "re-engagement",
      recipient: params.email,
      status: "suppressed",
      suppressionReason: "pref_disabled",
    });
    return;
  }

  try {
    const { ReEngagementEmail } = await import("@/emails/re-engagement");
    const { render } = await import("@react-email/components");
    const name = params.firstName || "there";
    const html = await render(
      ReEngagementEmail({
        firstName: name,
        lastActiveDate: params.lastActiveDate,
        featuredProperties: params.featuredProperties,
        loginUrl: params.loginUrl,
        unsubscribeUrl: "",
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: `We miss you, ${name} – here's what's new on Britestate`,
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "re-engagement",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "re-engagement",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendReEngagement failed", message);
  }
}

// ---------------------------------------------------------------------------
// 19. Refund Confirmed (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendRefundConfirmation(params: {
  userId: string;
  email: string;
  userName: string;
  refundAmount: string;
  chargeReference: string;
  refundDate: string;
}): Promise<void> {
  try {
    const { RefundConfirmedEmail } = await import("@/emails/refund-confirmed");
    const { render } = await import("@react-email/components");
    const name = params.userName || "there";
    const html = await render(
      RefundConfirmedEmail({
        userName: name,
        refundAmount: params.refundAmount,
        chargeReference: params.chargeReference,
        refundDate: params.refundDate,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Your refund has been processed – Britestate",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "refund-confirmed",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "refund-confirmed",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendRefundConfirmation failed", message);
  }
}

// ---------------------------------------------------------------------------
// 20. Refund Rejected (always send — no pref check)
// ---------------------------------------------------------------------------

export async function sendRefundRejected(params: {
  userId: string;
  email: string;
  userName: string;
  chargeAmount: string;
  reason: string;
  adminNotes?: string;
}): Promise<void> {
  try {
    const { RefundRejectedEmail } = await import("@/emails/refund-rejected");
    const { render } = await import("@react-email/components");
    const name = params.userName || "there";
    const html = await render(
      RefundRejectedEmail({
        userName: name,
        chargeAmount: params.chargeAmount,
        reason: params.reason,
        adminNotes: params.adminNotes,
      })
    );

    const { data, error } = await resendSend({
      from: FROM,
      to: params.email,
      subject: "Refund request update – Britestate",
      html,
    });

    if (error) throw error;
    await logEmail({
      userId: params.userId,
      template: "refund-rejected",
      recipient: params.email,
      resendId: data?.id,
      status: "sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logEmail({
      userId: params.userId,
      template: "refund-rejected",
      recipient: params.email,
      status: "failed",
      errorMessage: message,
    });
    console.error("[email-service] sendRefundRejected failed", message);
  }
}

// Re-export BASE_URL for use in other modules that build email links
export { BASE_URL };
