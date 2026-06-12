import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";
import { priceDropAlerts } from "@/inngest/functions/price-drop-alerts";
import { stripeWebhookDlq } from "@/inngest/functions/stripe-webhook-dlq";
import { jwtHookMonitor } from "@/inngest/functions/jwt-hook-monitor";
import { chainRiskMonitor } from "@/inngest/functions/chain-risk-monitor";
import { quoteAcceptedToBooking } from "@/inngest/functions/quote-accepted-to-booking";
import { gdprUserPurge } from "@/inngest/functions/gdpr-user-purge";
import { truedeedNotifyIntroduction } from "@/inngest/functions/truedeed-notify-introduction";
import { truedeedHashAnchor } from "@/inngest/functions/truedeed-hash-anchor";
import { truedeedExpireIntroductions } from "@/inngest/functions/truedeed-expire-introductions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    rfqNotifyProviders,
    priceDropAlerts,
    stripeWebhookDlq,
    jwtHookMonitor,
    chainRiskMonitor,
    quoteAcceptedToBooking,
    gdprUserPurge,
    truedeedNotifyIntroduction,
    truedeedHashAnchor,
    truedeedExpireIntroductions,
  ],
});
