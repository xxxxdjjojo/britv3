/**
 * POST /api/email/digest -- cron-triggered daily digest email route.
 * Secured via Authorization: Bearer CRON_SECRET header.
 * For each user with digest_frequency != 'never', gathers recent events
 * and sends a digest email.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNotificationFeed,
  getUserEntityIds,
} from "@/services/notifications/notification-service";
import { sendDailyDigest, shouldSendEmail } from "@/services/notifications/email-service";
import type { NotificationPreferences } from "@/types/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notifications";

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = createAdminClient();

    // Get all users with digest_frequency != 'never'
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, notification_preferences, last_digest_at")
      .neq("notification_preferences->digest_frequency", "never");

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    let sent = 0;
    let skipped = 0;

    for (const user of users ?? []) {
      if (!user.email) {
        skipped++;
        continue;
      }

      const preferences: NotificationPreferences =
        user.notification_preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

      // Skip if user has email disabled for all event types
      const hasAnyEmail = Object.values(preferences.per_type).some(
        (pref) => pref?.email,
      );
      if (!hasAnyEmail) {
        skipped++;
        continue;
      }

      // Get events since last digest (or last 24 hours)
      const since = user.last_digest_at
        ? new Date(user.last_digest_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const entityIds = await getUserEntityIds(supabase, user.id);
      const events = await getNotificationFeed(
        supabase,
        user.id,
        entityIds,
        50,
      );

      // Filter to events since last digest that qualify for email
      const digestEvents = events.filter(
        (event) =>
          new Date(event.created_at) > since &&
          shouldSendEmail(preferences, event.event_type),
      );

      if (digestEvents.length === 0) {
        skipped++;
        continue;
      }

      const result = await sendDailyDigest(
        user.email,
        user.display_name ?? "there",
        digestEvents,
      );

      if (result.sent) {
        // Update last_digest_at
        await supabase
          .from("profiles")
          .update({ last_digest_at: new Date().toISOString() })
          .eq("id", user.id);
        sent++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      total: (users ?? []).length,
    });
  } catch (err) {
    console.error("[api/email/digest] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
