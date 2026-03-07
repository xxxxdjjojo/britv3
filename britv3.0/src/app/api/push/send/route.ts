import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push";
import type { PushSubscriptionData } from "@/lib/push";

const sendSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  icon: z.string().optional(),
});

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = request.headers.get("authorization");

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { userId, title, body: notifBody, url, icon } = parsed.data;

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
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
        const result = await sendPushNotification(subscription, {
          title,
          body: notifBody,
          url,
          icon,
        });
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }),
  );

  return NextResponse.json({ sent, failed });
}
