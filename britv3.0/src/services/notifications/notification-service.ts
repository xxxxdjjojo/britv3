/**
 * Notification service -- O(1) event writes, feed queries, and read tracking.
 * Platform events are written once per action (not fan-out per recipient).
 * The feed is assembled by querying events matching the user's entity IDs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformEvent, EventType, EntityType } from "@/types/notifications";
import { sendCriticalEmail } from "./email-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Events that trigger immediate email notification */
export const CRITICAL_EVENTS: ReadonlySet<EventType> = new Set([
  "quote_received",
  "booking_confirmed",
  "offer_received",
]);

/** All non-critical events (batched into digest) */
export const DIGEST_EVENTS: ReadonlySet<EventType> = new Set([
  "new_message",
  "quote_sent",
  "booking_updated",
  "milestone_updated",
  "viewing_scheduled",
  "review_posted",
]);

// ---------------------------------------------------------------------------
// Event creation
// ---------------------------------------------------------------------------

type CreateEventInput = Readonly<{
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  actor_id: string;
  metadata?: Record<string, unknown>;
}>;

/**
 * Insert a single platform event row. O(1) per action.
 * If the event is critical, dispatches an immediate email notification.
 */
export async function createPlatformEvent(
  supabase: SupabaseClient,
  input: CreateEventInput,
): Promise<PlatformEvent> {
  const { data, error } = await supabase
    .from("platform_events")
    .insert({
      event_type: input.event_type,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      metadata: input.metadata ?? {},
    })
    .select("*, profiles!platform_events_actor_id_fkey(display_name)")
    .single();

  if (error) {
    throw new Error(`Failed to create platform event: ${error.message}`);
  }

  const event: PlatformEvent = {
    id: data.id,
    event_type: data.event_type,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    actor_id: data.actor_id,
    metadata: data.metadata ?? {},
    created_at: new Date(data.created_at),
    actor_name: data.profiles?.display_name ?? null,
  };

  // Fire-and-forget critical email (do not block event creation)
  if (CRITICAL_EVENTS.has(input.event_type)) {
    void dispatchCriticalEmail(supabase, event);
  }

  return event;
}

// ---------------------------------------------------------------------------
// Feed queries
// ---------------------------------------------------------------------------

/**
 * Get notification feed for a user by querying events matching their entity IDs.
 * Excludes the user's own actions. Cursor-based pagination on created_at.
 */
export async function getNotificationFeed(
  supabase: SupabaseClient,
  userId: string,
  userEntityIds: string[],
  limit = 50,
  cursor?: string,
): Promise<PlatformEvent[]> {
  if (userEntityIds.length === 0) return [];

  let query = supabase
    .from("platform_events")
    .select("*, profiles!platform_events_actor_id_fkey(display_name)")
    .in("entity_id", userEntityIds)
    .neq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notification feed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    event_type: row.event_type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    actor_id: row.actor_id,
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at),
    actor_name: row.profiles?.display_name ?? null,
  }));
}

/**
 * Count unread notifications since the user's last read timestamp.
 */
export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
  userEntityIds: string[],
  lastReadAt: Date,
): Promise<number> {
  if (userEntityIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("platform_events")
    .select("id", { count: "exact", head: true })
    .in("entity_id", userEntityIds)
    .neq("actor_id", userId)
    .gt("created_at", lastReadAt.toISOString());

  if (error) {
    throw new Error(`Failed to count unread notifications: ${error.message}`);
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Read tracking
// ---------------------------------------------------------------------------

/**
 * Mark all notifications as read by updating the user's notifications_read_at.
 */
export async function markAllRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ notifications_read_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Entity ID resolution
// ---------------------------------------------------------------------------

/**
 * Collect all entity IDs the user is involved in (conversations, bookings, listings).
 * These IDs are used to filter the notification feed.
 */
export async function getUserEntityIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const entityIds: string[] = [];

  // Conversations the user participates in
  const { data: conversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (conversations) {
    entityIds.push(...conversations.map((c) => c.conversation_id));
  }

  // Bookings where user is client or provider
  const { data: bookingsAsClient } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", userId);

  if (bookingsAsClient) {
    entityIds.push(...bookingsAsClient.map((b) => b.id));
  }

  const { data: bookingsAsProvider } = await supabase
    .from("bookings")
    .select("id")
    .eq("provider_id", userId);

  if (bookingsAsProvider) {
    entityIds.push(...bookingsAsProvider.map((b) => b.id));
  }

  // Listings owned by user
  const { data: listings } = await supabase
    .from("listings")
    .select("id")
    .eq("user_id", userId);

  if (listings) {
    entityIds.push(...listings.map((l) => l.id));
  }

  return entityIds;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Look up the actor's email + preferences and dispatch a critical email.
 * Called as fire-and-forget from createPlatformEvent.
 */
async function dispatchCriticalEmail(
  supabase: SupabaseClient,
  event: PlatformEvent,
): Promise<void> {
  try {
    // Find users associated with this entity (excluding the actor)
    const entityIds = [event.entity_id];
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .in("conversation_id", entityIds);

    // For non-conversation entities, look up the owner
    const recipientIds: string[] = [];

    if (participants?.length) {
      recipientIds.push(
        ...participants
          .map((p) => p.user_id)
          .filter((id: string) => id !== event.actor_id),
      );
    }

    // Dispatch email to each recipient
    for (const recipientId of recipientIds) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name, notification_preferences")
        .eq("id", recipientId)
        .single();

      if (!profile?.email) continue;

      const subject = getEmailSubject(event);
      await sendCriticalEmail(profile.email, subject, event);
    }
  } catch {
    // Log but don't throw -- email failure should not break event creation
    console.error("[notification-service] Failed to dispatch critical email");
  }
}

/** Generate email subject line from event type */
function getEmailSubject(event: PlatformEvent): string {
  const actor = event.actor_name ?? "Someone";
  switch (event.event_type) {
    case "quote_received":
      return `${actor} sent you a quote on Britestate`;
    case "booking_confirmed":
      return "Your booking has been confirmed - Britestate";
    case "offer_received":
      return `${actor} made an offer on your property - Britestate`;
    default:
      return "New notification from Britestate";
  }
}
