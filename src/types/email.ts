// Email log audit record (mirrors email_logs Supabase table)
export type EmailLogStatus = "sent" | "failed" | "suppressed";
export type EmailSuppressionReason = "unsubscribed" | "no_content" | "pref_disabled";

export type EmailLog = {
  id: string;
  user_id: string | null;
  template: string;
  recipient: string;
  resend_id: string | null;
  status: EmailLogStatus;
  suppression_reason: EmailSuppressionReason | null;
  error_message: string | null;
  created_at: string;
};

// Per-template prop types

export type WelcomeEmailProps = {
  firstName: string;
  loginUrl?: string;
};

export type VerificationEmailProps = {
  firstName: string;
  verificationUrl: string;
  expiresInHours?: number;
};

export type PasswordResetEmailProps = {
  firstName: string;
  resetUrl: string;
  expiresInMinutes?: number;
};

export type PropertyAlertEmailProps = {
  firstName: string;
  searchName: string;
  matchingProperties: Array<{
    id: string;
    address: string;
    price: number;
    bedrooms: number;
    imageUrl?: string;
    listingUrl: string;
  }>;
  manageAlertsUrl: string;
};

export type ViewingConfirmationEmailProps = {
  firstName: string;
  propertyAddress: string;
  viewingDate: string; // ISO date string
  viewingTime: string;
  agentName: string;
  agentPhone?: string;
  propertyUrl: string;
  calendarUrl?: string;
};

export type ViewingReminderEmailProps = {
  firstName: string;
  propertyAddress: string;
  viewingDate: string;
  viewingTime: string;
  agentName: string;
  agentPhone?: string;
  propertyUrl: string;
};

export type OfferReceivedEmailProps = {
  agentFirstName: string;
  propertyAddress: string;
  offerAmount: number;
  buyerName: string;
  submittedAt: string;
  dashboardUrl: string;
};

export type OfferStatusEmailProps = {
  firstName: string;
  propertyAddress: string;
  offerAmount: number;
  status: "accepted" | "rejected";
  message?: string;
  nextStepsUrl?: string;
};

export type NewEnquiryEmailProps = {
  providerFirstName: string;
  enquirerName: string;
  enquirerEmail: string;
  enquirerPhone?: string;
  serviceType: string;
  message: string;
  dashboardUrl: string;
};

export type ReviewReceivedEmailProps = {
  recipientFirstName: string;
  reviewerName: string;
  rating: number; // 1-5
  comment?: string;
  propertyAddress?: string;
  reviewUrl: string;
};

export type ComplianceWarningEmailProps = {
  firstName: string;
  documentName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  uploadUrl: string;
};

export type PaymentConfirmationEmailProps = {
  firstName: string;
  amount: number;
  currency?: string;
  description: string;
  transactionId: string;
  paidAt: string;
  receiptUrl?: string;
};

export type PaymentFailedEmailProps = {
  firstName: string;
  amount: number;
  currency?: string;
  description: string;
  failedAt: string;
  retryUrl: string;
  supportUrl?: string;
};

export type RenewalReminderEmailProps = {
  firstName: string;
  planName: string;
  renewalDate: string;
  amount: number;
  currency?: string;
  manageSubscriptionUrl: string;
};

export type WeeklyDigestEmailProps = {
  firstName: string;
  weekStarting: string;
  savedSearchResults: Array<{
    searchName: string;
    newMatches: number;
    topProperty?: {
      address: string;
      price: number;
      imageUrl?: string;
      listingUrl: string;
    };
  }>;
  upcomingViewings: Array<{
    propertyAddress: string;
    date: string;
    time: string;
  }>;
  unreadMessages: number;
  dashboardUrl: string;
};

export type AccountDeletionEmailProps = {
  firstName: string;
  deletedAt: string;
  dataRetentionDays: number;
  supportUrl?: string;
};

export type ReferralInvitationEmailProps = {
  referrerName: string;
  recipientEmail: string;
  inviteUrl: string;
  rewardDescription?: string;
};

export type ReEngagementEmailProps = {
  firstName: string;
  lastActiveDate: string;
  featuredProperties: Array<{
    address: string;
    price: number;
    imageUrl?: string;
    listingUrl: string;
  }>;
  loginUrl: string;
  unsubscribeUrl: string;
};

export type RefundConfirmedEmailProps = {
  userName: string;
  refundAmount: string; // formatted e.g. "£29.00"
  chargeReference: string;
  refundDate: string;
};

export type RefundRejectedEmailProps = {
  userName: string;
  chargeAmount: string;
  reason: string;
  adminNotes?: string;
};

// Union type for all template prop types (useful for preview route)
export type AnyEmailProps =
  | WelcomeEmailProps
  | VerificationEmailProps
  | PasswordResetEmailProps
  | PropertyAlertEmailProps
  | ViewingConfirmationEmailProps
  | ViewingReminderEmailProps
  | OfferReceivedEmailProps
  | OfferStatusEmailProps
  | NewEnquiryEmailProps
  | ReviewReceivedEmailProps
  | ComplianceWarningEmailProps
  | PaymentConfirmationEmailProps
  | PaymentFailedEmailProps
  | RenewalReminderEmailProps
  | WeeklyDigestEmailProps
  | AccountDeletionEmailProps
  | ReferralInvitationEmailProps
  | ReEngagementEmailProps
  | RefundConfirmedEmailProps
  | RefundRejectedEmailProps;

// Template name → type mapping (for runtime lookups)
export type TemplateName =
  | "welcome"
  | "verification"
  | "password-reset"
  | "property-alert"
  | "viewing-confirmation"
  | "viewing-reminder"
  | "offer-received"
  | "offer-status"
  | "new-enquiry"
  | "review-received"
  | "compliance-warning"
  | "payment-confirmation"
  | "payment-failed"
  | "renewal-reminder"
  | "weekly-digest"
  | "account-deletion"
  | "referral-invitation"
  | "re-engagement"
  | "refund-confirmed"
  | "refund-rejected";
