import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";
import { priceDropAlerts } from "@/inngest/functions/price-drop-alerts";
import { stripeWebhookDlq } from "@/inngest/functions/stripe-webhook-dlq";
import { jwtHookMonitor } from "@/inngest/functions/jwt-hook-monitor";
import { chainRiskMonitor } from "@/inngest/functions/chain-risk-monitor";
import { quoteAcceptedToBooking } from "@/inngest/functions/quote-accepted-to-booking";
import { referenceRequested } from "@/inngest/functions/reference-requested";
import { referenceSubmitted } from "@/inngest/functions/reference-submitted";
import { verificationComplete } from "@/inngest/functions/verification-complete";
import { referenceAutoReminders } from "@/inngest/functions/reference-auto-reminders";
import { documentRejected } from "@/inngest/functions/document-rejected";
import { verificationReEngagement } from "@/inngest/functions/verification-re-engagement";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    rfqNotifyProviders,
    priceDropAlerts,
    stripeWebhookDlq,
    jwtHookMonitor,
    chainRiskMonitor,
    quoteAcceptedToBooking,
    referenceRequested,
    referenceSubmitted,
    verificationComplete,
    referenceAutoReminders,
    documentRejected,
    verificationReEngagement,
  ],
});
