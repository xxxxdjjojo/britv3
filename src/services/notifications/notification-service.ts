/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Notification service -- O(1) event writes, feed queries, and read tracking.
 * Platform events are written once per action (not fan-out per recipient).
 * The feed is assembled by querying events matching the user's entity IDs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { brandConfig } from "@/config/brand";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformEvent, EventType, EntityType } from "@/types/notifications";
import { sendCriticalEmail, sendGuestQuoteEmail } from "./email-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Events that trigger immediate email notification */
export const CRITICAL_EVENTS: ReadonlySet<EventType> = new Set([
  "quote_received",
  "booking_confirmed",
  "offer_received",
  "maintenance_request_created",
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
  // NB: actor_id FKs to auth.users, not profiles, so PostgREST cannot embed
  // `profiles` off that constraint — the display name is resolved separately.
  const { data, error } = await supabase
    .from("platform_events")
    .insert({
      event_type: input.event_type,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create platform event: ${error.message}`);
  }

  const actorNames = await resolveActorNames(supabase, [data.actor_id]);

  const event: PlatformEvent = {
    id: data.id,
    event_type: data.event_type,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    actor_id: data.actor_id,
    metadata: data.metadata ?? {},
    created_at: new Date(data.created_at),
    actor_name: actorNames.get(data.actor_id) ?? null,
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
    .select("*")
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

  const rows = data ?? [];
  const actorNames = await resolveActorNames(
    supabase,
    rows.map((r) => r.actor_id),
  );

  return rows.map((row) => ({
    id: row.id,
    event_type: row.event_type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    actor_id: row.actor_id,
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at),
    actor_name: actorNames.get(row.actor_id) ?? null,
  }));
}

/**
 * Resolve actor display names from `profiles`. Kept separate from the
 * platform_events query because actor_id FKs to auth.users, not profiles, so
 * PostgREST cannot embed the relationship. Best-effort: a missing/unreadable
 * profile yields no entry (rendered as "Someone" downstream).
 */
async function resolveActorNames(
  supabase: SupabaseClient,
  actorIds: string[],
): Promise<Map<string, string | null>> {
  const unique = [...new Set(actorIds)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);

  return new Map((data ?? []).map((p) => [p.id, p.display_name ?? null]));
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
    .from("conversations")
    .select("id")
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

  if (conversations) {
    entityIds.push(...conversations.map((c) => c.id));
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

  // Service requests (RFQs) owned by the user — so quote_received events surface
  const { data: rfqs } = await supabase
    .from("service_requests")
    .select("id")
    .eq("user_id", userId);

  if (rfqs) {
    entityIds.push(...rfqs.map((r) => r.id));
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
    const recipientIds: string[] = [];
    // Client used for the recipient profile lookups below. The rfq branch
    // swaps this for the service-role client (see comment there).
    let recipientClient: SupabaseClient = supabase;

    if (event.entity_type === "maintenance_request") {
      // Look up the property owner (landlord) from maintenance_requests -> properties
      const { data: request } = await supabase
        .from("maintenance_requests")
        .select("property_id")
        .eq("id", event.entity_id)
        .single();

      if (request?.property_id) {
        const { data: property } = await supabase
          .from("properties")
          .select("user_id")
          .eq("id", request.property_id)
          .single();

        if (property?.user_id && property.user_id !== event.actor_id) {
          recipientIds.push(property.user_id);
        }
      }
    } else if (event.entity_type === "rfq") {
      // Quote landed on a service request — notify its owner. Guest RFQs
      // (user_id NULL) have no account, so email the captured address directly.
      //
      // MUST read via the service-role client: the caller here is the quoting
      // PROVIDER, whose only SELECT grant on service_requests requires
      // status = 'open' — and quote-service flips the status to
      // 'quotes_received' BEFORE emitting this event, so the caller's client
      // returns no row. (Same precedent as
      // src/services/messaging/message-notifications.ts.) The recipient's
      // profile is equally not readable by the provider, so the profile
      // lookup below uses the admin client too.
      const admin = createAdminClient();
      recipientClient = admin;
      const { data: rfq } = await admin
        .from("service_requests")
        .select("user_id, contact_email, contact_name, title")
        .eq("id", event.entity_id)
        .single();

      if (rfq?.user_id && rfq.user_id !== event.actor_id) {
        recipientIds.push(rfq.user_id);
      } else if (!rfq?.user_id && rfq?.contact_email) {
        const subject = getEmailSubject(event);
        await sendGuestQuoteEmail(rfq.contact_email, subject, event);
        return;
      }
    } else {
      // Default: find users associated via conversations
      const { data: conversation } = await supabase
        .from("conversations")
        .select("participant_1_id, participant_2_id")
        .eq("id", event.entity_id)
        .single();

      if (conversation?.participant_1_id && conversation.participant_1_id !== event.actor_id) {
        recipientIds.push(conversation.participant_1_id);
      }
      if (conversation?.participant_2_id && conversation.participant_2_id !== event.actor_id) {
        recipientIds.push(conversation.participant_2_id);
      }
    }

    // Dispatch email to each recipient
    for (const recipientId of recipientIds) {
      const { data: profile } = await recipientClient
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
  const brandName = brandConfig.displayName;
  switch (event.event_type) {
    case "quote_received":
      return `${actor} sent you a quote on ${brandName}`;
    case "booking_confirmed":
      return `Your booking has been confirmed - ${brandName}`;
    case "offer_received":
      return `${actor} made an offer on your property - ${brandName}`;
    case "maintenance_request_created":
      return `${actor} submitted a maintenance request - ${brandName}`;
    default:
      return `New notification from ${brandName}`;
  }
}
