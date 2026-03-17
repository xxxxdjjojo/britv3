/**
 * Notification domain types -- platform events and user preferences.
 * Mirrors the platform_events table in 003_dashboards_communication.sql.
 */

// -- Enums -------------------------------------------------------------------

/** All platform event types that generate notifications */
export type EventType =
  | "new_message"
  | "quote_received"
  | "quote_sent"
  | "booking_confirmed"
  | "booking_updated"
  | "milestone_updated"
  | "offer_received"
  | "viewing_scheduled"
  | "review_posted";

/** Entity types that events can reference */
export type EntityType =
  | "conversation"
  | "booking"
  | "listing"
  | "rfq"
  | "transaction";

/** Email priority for notification routing */
export type EmailPriority = "critical" | "digest";

/** Digest frequency options */
export type DigestFrequency = "daily" | "weekly" | "never";

// -- Table row types ---------------------------------------------------------

/** Mirrors public.platform_events table (with joined fields) */
export type PlatformEvent = Readonly<{
  id: number;
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  actor_id: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  /** Joined: actor's display name */
  actor_name: string | null;
}>;

// -- Preference types --------------------------------------------------------

/** Per-event-type notification channel preferences */
export type EventChannelPreferences = Readonly<{
  in_app: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}>;

/** Quiet hours configuration */
export type QuietHours = Readonly<{
  enabled: boolean;
  /** HH:MM format, e.g. "22:00" */
  start: string;
  /** HH:MM format, e.g. "07:00" */
  end: string;
}>;

/** Full notification preferences stored in profiles.preferences JSONB */
export type NotificationPreferences = Readonly<{
  per_type: Partial<Record<EventType, EventChannelPreferences>>;
  quiet_hours: QuietHours;
  digest_frequency: DigestFrequency;
}>;

/** Default notification preferences for new users */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  per_type: {
    new_message: { in_app: true, email: true, push: false, sms: false },
    quote_received: { in_app: true, email: true, push: false, sms: false },
    quote_sent: { in_app: true, email: false, push: false, sms: false },
    booking_confirmed: { in_app: true, email: true, push: false, sms: false },
    booking_updated: { in_app: true, email: false, push: false, sms: false },
    milestone_updated: { in_app: true, email: true, push: false, sms: false },
    offer_received: { in_app: true, email: true, push: false, sms: false },
    viewing_scheduled: { in_app: true, email: true, push: false, sms: false },
    review_posted: { in_app: true, email: false, push: false, sms: false },
  },
  quiet_hours: {
    enabled: false,
    start: "22:00",
    end: "07:00",
  },
  digest_frequency: "daily",
} as const;
