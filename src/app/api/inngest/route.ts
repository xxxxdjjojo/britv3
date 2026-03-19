import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";
import { priceDropAlerts } from "@/inngest/functions/price-drop-alerts";
import { stripeWebhookDlq } from "@/inngest/functions/stripe-webhook-dlq";
import { jwtHookMonitor } from "@/inngest/functions/jwt-hook-monitor";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    rfqNotifyProviders,
    priceDropAlerts,
    stripeWebhookDlq,
    jwtHookMonitor,
  ],
});
