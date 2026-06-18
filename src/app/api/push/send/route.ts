import { NextResponse } from "next/server";
import { z } from "zod";
import { inngest } from "@/inngest/client";
import { createRateLimiter } from "@/lib/cache/redis";
import {
  PUSH_SIGNATURE_HEADER,
  PUSH_TIMESTAMP_HEADER,
  verifyPushSignature,
} from "@/lib/push/push-auth";
import {
  PUSH_NOTIFICATION_TYPES,
  buildPushNotification,
} from "@/lib/push/push-notifications";

// No free-text title/body: the message is built server-side from `type`.
const sendSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(PUSH_NOTIFICATION_TYPES),
  data: z
    .object({
      label: z.string().max(200).optional(),
      url: z.string().max(500).optional(),
    })
    .optional(),
});

// 10 dispatches per minute per recipient — caps blast radius if a signed
// request is replayed within the skew window.
const limiter = createRateLimiter(10, "1 m");

export async function POST(request: Request) {
  if (!process.env.PUSH_SECRET) {
    return NextResponse.json({ error: "Push service not configured" }, { status: 503 });
  }

  // Verify the HMAC over the raw body + timestamp before parsing.
  const rawBody = await request.text();
  const signature = request.headers.get(PUSH_SIGNATURE_HEADER);
  const timestamp = request.headers.get(PUSH_TIMESTAMP_HEADER);
  if (!verifyPushSignature(timestamp, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { userId, type, data } = parsed.data;

  const { success } = await limiter.limit(`push:${userId}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const notification = buildPushNotification(type, data);

  // Dispatch via Inngest (platform-signed) rather than sending inline.
  await inngest.send({
    name: "notifications/push.send",
    data: { userId, notification },
  });

  return NextResponse.json({ queued: true }, { status: 202 });
}
