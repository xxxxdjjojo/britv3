/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { render } from "@react-email/components";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Template loaders — dynamic imports to avoid circular deps
const templateMap = {
  welcome: () => import("@/emails/welcome").then((m) => m.WelcomeEmail),
  verification: () => import("@/emails/verification").then((m) => m.VerificationEmail),
  "password-reset": () => import("@/emails/password-reset").then((m) => m.PasswordResetEmail),
  "property-alert": () => import("@/emails/property-alert").then((m) => m.PropertyAlertEmail),
  "viewing-confirmation": () => import("@/emails/viewing-confirmation").then((m) => m.ViewingConfirmationEmail),
  "viewing-reminder": () => import("@/emails/viewing-reminder").then((m) => m.ViewingReminderEmail),
  "offer-received": () => import("@/emails/offer-received").then((m) => m.OfferReceivedEmail),
  "offer-status": () => import("@/emails/offer-status").then((m) => m.OfferStatusEmail),
  "new-enquiry": () => import("@/emails/new-enquiry").then((m) => m.NewEnquiryEmail),
  "review-received": () => import("@/emails/review-received").then((m) => m.ReviewReceivedEmail),
  "compliance-warning": () => import("@/emails/compliance-warning").then((m) => m.ComplianceWarningEmail),
  "payment-confirmation": () => import("@/emails/payment-confirmation").then((m) => m.PaymentConfirmationEmail),
  "payment-failed": () => import("@/emails/payment-failed").then((m) => m.PaymentFailedEmail),
  "renewal-reminder": () => import("@/emails/renewal-reminder").then((m) => m.RenewalReminderEmail),
  "weekly-digest": () => import("@/emails/weekly-digest").then((m) => m.WeeklyDigestEmail),
  "account-deletion": () => import("@/emails/account-deletion").then((m) => m.AccountDeletionEmail),
  "referral-invitation": () => import("@/emails/referral-invitation").then((m) => m.ReferralInvitationEmail),
  "re-engagement": () => import("@/emails/re-engagement").then((m) => m.ReEngagementEmail),
} as const;

type TemplateName = keyof typeof templateMap;

// Mock props for each template — realistic preview data
const mockProps: Record<TemplateName, Record<string, unknown>> = {
  welcome: {
    firstName: "Sarah",
    loginUrl: "https://britestate.co.uk/dashboard",
  },
  verification: {
    firstName: "Sarah",
    verificationUrl: "https://britestate.co.uk/auth/verify?token=mock-token-abc123",
    expiresInHours: 24,
  },
  "password-reset": {
    firstName: "Sarah",
    resetUrl: "https://britestate.co.uk/auth/reset-password?token=mock-token-xyz",
    expiresInMinutes: 60,
  },
  "property-alert": {
    firstName: "Sarah",
    searchName: "2-bed flats in Shoreditch",
    matchingProperties: [
      {
        id: "prop-1",
        address: "14 Hoxton Square, London, N1 6NT",
        price: 650000,
        bedrooms: 2,
        imageUrl: undefined,
        listingUrl: "https://britestate.co.uk/properties/prop-1",
      },
      {
        id: "prop-2",
        address: "8 Redchurch Street, London, E2 7DP",
        price: 725000,
        bedrooms: 2,
        imageUrl: undefined,
        listingUrl: "https://britestate.co.uk/properties/prop-2",
      },
    ],
    manageAlertsUrl: "https://britestate.co.uk/dashboard/alerts",
  },
  "viewing-confirmation": {
    firstName: "Sarah",
    propertyAddress: "42 Notting Hill Gate, London, W11 3HX",
    viewingDate: "2026-03-20",
    viewingTime: "14:30",
    agentName: "James Wilson",
    agentPhone: "07700 900123",
    propertyUrl: "https://britestate.co.uk/properties/prop-3",
    calendarUrl: undefined,
  },
  "viewing-reminder": {
    firstName: "Sarah",
    propertyAddress: "42 Notting Hill Gate, London, W11 3HX",
    viewingDate: "2026-03-20",
    viewingTime: "14:30",
    agentName: "James Wilson",
    agentPhone: "07700 900123",
    propertyUrl: "https://britestate.co.uk/properties/prop-3",
  },
  "offer-received": {
    agentFirstName: "James",
    propertyAddress: "42 Notting Hill Gate, London, W11 3HX",
    offerAmount: 850000,
    buyerName: "Sarah Thompson",
    submittedAt: "2026-03-15T10:30:00Z",
    dashboardUrl: "https://britestate.co.uk/dashboard/offers",
  },
  "offer-status": {
    firstName: "Sarah",
    propertyAddress: "42 Notting Hill Gate, London, W11 3HX",
    offerAmount: 850000,
    status: "accepted",
    message: "We are delighted to accept your offer. Our solicitors will be in touch shortly.",
    nextStepsUrl: "https://britestate.co.uk/dashboard/offers",
  },
  "new-enquiry": {
    providerFirstName: "Michael",
    enquirerName: "Sarah Thompson",
    enquirerEmail: "sarah.thompson@example.com",
    enquirerPhone: "07700 900456",
    serviceType: "Plumbing",
    message: "I need an emergency plumber for a burst pipe. Can you come today?",
    dashboardUrl: "https://britestate.co.uk/dashboard/enquiries",
  },
  "review-received": {
    recipientFirstName: "Michael",
    reviewerName: "Sarah Thompson",
    rating: 5,
    comment: "Excellent service! Highly professional and arrived on time. Would definitely recommend.",
    propertyAddress: "42 Notting Hill Gate, London, W11 3HX",
    reviewUrl: "https://britestate.co.uk/dashboard/reviews",
  },
  "compliance-warning": {
    firstName: "James",
    documentName: "EPC Certificate",
    expiryDate: "2026-04-01",
    daysUntilExpiry: 17,
    uploadUrl: "https://britestate.co.uk/dashboard/compliance",
  },
  "payment-confirmation": {
    firstName: "Sarah",
    amount: 2999,
    currency: "GBP",
    description: "Britestate Pro — Monthly Subscription",
    transactionId: "txn_1A2B3C4D5E6F7G8H",
    paidAt: "2026-03-15T09:00:00Z",
    receiptUrl: "https://britestate.co.uk/billing/receipts/txn-abc",
  },
  "payment-failed": {
    firstName: "Sarah",
    amount: 2999,
    currency: "GBP",
    description: "Britestate Pro — Monthly Subscription",
    failedAt: "2026-03-15T09:00:00Z",
    retryUrl: "https://britestate.co.uk/billing/retry",
    supportUrl: "https://britestate.co.uk/support",
  },
  "renewal-reminder": {
    firstName: "Sarah",
    planName: "Britestate Pro",
    renewalDate: "2026-04-15",
    amount: 2999,
    currency: "GBP",
    manageSubscriptionUrl: "https://britestate.co.uk/billing",
  },
  "weekly-digest": {
    firstName: "Sarah",
    weekStarting: "2026-03-09",
    savedSearchResults: [
      {
        searchName: "2-bed flats in Shoreditch",
        newMatches: 3,
        topProperty: {
          address: "14 Hoxton Square, London, N1 6NT",
          price: 650000,
          listingUrl: "https://britestate.co.uk/properties/prop-1",
        },
      },
    ],
    upcomingViewings: [
      {
        propertyAddress: "42 Notting Hill Gate, London, W11 3HX",
        date: "2026-03-20",
        time: "14:30",
      },
    ],
    unreadMessages: 2,
    dashboardUrl: "https://britestate.co.uk/dashboard",
  },
  "account-deletion": {
    firstName: "Sarah",
    deletedAt: "2026-03-15T12:00:00Z",
    dataRetentionDays: 30,
    supportUrl: "https://britestate.co.uk/support",
  },
  "referral-invitation": {
    referrerName: "James Wilson",
    recipientEmail: "friend@example.com",
    inviteUrl: "https://britestate.co.uk/signup?ref=mock-ref-token",
    rewardDescription: "get 1 month free on any paid plan",
  },
  "re-engagement": {
    firstName: "Sarah",
    lastActiveDate: "2026-02-01",
    featuredProperties: [
      {
        address: "14 Hoxton Square, London, N1 6NT",
        price: 650000,
        listingUrl: "https://britestate.co.uk/properties/prop-1",
      },
      {
        address: "8 Redchurch Street, London, E2 7DP",
        price: 725000,
        listingUrl: "https://britestate.co.uk/properties/prop-2",
      },
    ],
    loginUrl: "https://britestate.co.uk/dashboard",
    unsubscribeUrl: "https://britestate.co.uk/unsubscribe?token=mock",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  // Require admin authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
  }

  const { template } = await params;
  const loader = templateMap[template as TemplateName];

  if (!loader) {
    return NextResponse.json(
      { error: `Unknown template: "${template}". Valid templates: ${Object.keys(templateMap).join(", ")}` },
      { status: 404 }
    );
  }

  try {
    const Component = await loader();
    const props = mockProps[template as TemplateName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = await render(<Component {...(props as any)} />);

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[api/emails/preview] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
