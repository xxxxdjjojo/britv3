import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rfqNotifyProviders } from "@/inngest/functions/rfq-notify-providers";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [rfqNotifyProviders],
});
