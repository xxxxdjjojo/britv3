import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { endpoint, keys, userAgent } = parsed.data;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,endpoint",
    },
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { endpoint } = parsed.data;

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
