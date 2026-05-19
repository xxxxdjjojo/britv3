/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * GET /api/notifications -- notification feed or unread count for current user.
 * Query params:
 *   - count_only=true: returns { count: number } only
 *   - cursor: ISO timestamp for pagination
 *   - limit: max items to return (default 50)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNotificationFeed,
  getUnreadNotificationCount,
  getUserEntityIds,
} from "@/services/notifications/notification-service";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("count_only") === "true";

    // Get all entity IDs the user is involved in
    const entityIds = await getUserEntityIds(supabase, user.id);

    if (countOnly) {
      // Fetch user's last read timestamp
      const { data: profile } = await supabase
        .from("profiles")
        .select("notifications_read_at")
        .eq("id", user.id)
        .single();

      const lastReadAt = profile?.notifications_read_at
        ? new Date(profile.notifications_read_at)
        : new Date(0); // epoch = never read

      const count = await getUnreadNotificationCount(
        supabase,
        user.id,
        entityIds,
        lastReadAt,
      );

      return NextResponse.json({ count });
    }

    // Full feed
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10),
      100,
    );

    const notifications = await getNotificationFeed(
      supabase,
      user.id,
      entityIds,
      limit,
      cursor,
    );

    // Include last read timestamp for unread visual distinction
    const { data: profile } = await supabase
      .from("profiles")
      .select("notifications_read_at")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      notifications,
      lastReadAt: profile?.notifications_read_at ?? null,
      nextCursor:
        notifications.length === limit
          ? notifications[notifications.length - 1]?.created_at.toISOString()
          : null,
    });
  } catch (err) {
    console.error("[api/notifications] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
