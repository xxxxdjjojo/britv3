/**
 * Inngest function: push notification dispatch (BRIT-S008).
 *
 * The actual web-push send now lives behind an Inngest event
 * (`notifications/push.send`) rather than a static-bearer HTTP route. Inngest
 * verifies the signing key on every invocation, so the dispatch path is
 * platform-authenticated. Internal callers emit the event via inngest.send();
 * the HTTP route at /api/push/send forwards HMAC-verified requests here.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification, type PushSubscriptionData } from "@/lib/push";
import { captureException } from "@/lib/observability/capture-exception";

export type PushDispatchEvent = {
  data: {
    userId: string;
    notification: { title: string; body: string; url: string };
  };
};

export const pushDispatch = inngest.createFunction(
  { id: "push-dispatch", name: "Dispatch web-push notification" },
  { event: "notifications/push.send" },
  async ({ event, step }) => {
    const { userId, notification } = event.data as PushDispatchEvent["data"];

    const result = await step.run("send-to-subscriptions", async () => {
      const admin = createAdminClient();
      const { data: subscriptions, error } = await admin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (error) {
        captureException(error, {
          module: "notifications",
          feature: "push-dispatch",
          operation: "fetchSubscriptions",
          extra: { userId },
        });
        return { sent: 0, failed: 0 };
      }

      if (!subscriptions || subscriptions.length === 0) {
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      await Promise.all(
        subscriptions.map(async (sub) => {
          const subscription: PushSubscriptionData = {
            endpoint: sub.endpoint as string,
            keys: {
              p256dh: sub.p256dh as string,
              auth: sub.auth as string,
            },
          };
          try {
            const r = await sendPushNotification(subscription, notification);
            if (r.success) sent++;
            else failed++;
          } catch {
            failed++;
          }
        }),
      );

      return { sent, failed };
    });

    return { userId, ...result };
  },
);
