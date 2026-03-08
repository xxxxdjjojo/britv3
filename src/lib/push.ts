import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushSubscriptionData = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

type SendResult =
  | { success: true }
  | { success: false; reason: "expired" };

let vapidInitialized = false;

function initVapid() {
  if (vapidInitialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (publicKey && privateKey && subject) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
  }
}

export function getVapidPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload,
): Promise<SendResult> {
  initVapid();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 410) {
      const admin = createAdminClient();
      await admin
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);
      return { success: false, reason: "expired" };
    }
    throw err;
  }
}
