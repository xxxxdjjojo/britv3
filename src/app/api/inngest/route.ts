import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";
import { priceDropAlerts } from "@/inngest/functions/price-drop-alerts";
import { stripeWebhookDlq } from "@/inngest/functions/stripe-webhook-dlq";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [rfqNotifyProviders, priceDropAlerts, stripeWebhookDlq],
});
