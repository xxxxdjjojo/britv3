/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * POST /api/notifications/read -- mark all notifications as read.
 * Updates the user's notifications_read_at timestamp.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "@/services/notifications/notification-service";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    await markAllRead(supabase, user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/notifications/read] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
