/**
 * Server-side push notification template registry (BRIT-S008).
 *
 * The dispatch endpoint no longer accepts free-text `title`/`body` — an
 * attacker holding a signed request could otherwise craft a phishing push
 * ("Your offer was accepted — confirm at bit.ly/…"). Callers pass an
 * allow-listed `type` plus a small, sanitised `data` object; the title and
 * body are built here, server-side, from fixed copy.
 *
 * Types mirror the push-eligible subset of EventType in types/notifications.ts.
 */

export const PUSH_NOTIFICATION_TYPES = [
  "new_message",
  "quote_received",
  "booking_confirmed",
  "booking_updated",
  "offer_received",
  "viewing_scheduled",
  "review_posted",
] as const;

export type PushNotificationType = (typeof PUSH_NOTIFICATION_TYPES)[number];

export type PushNotificationData = Readonly<{
  /** Optional short context (e.g. an address or sender name). Sanitised. */
  label?: string;
  /** Optional in-app deep link. Must be an internal path. */
  url?: string;
}>;

export type BuiltPushNotification = Readonly<{
  title: string;
  body: string;
  url: string;
}>;

const MAX_LABEL_LENGTH = 80;
// Control characters (C0 + DEL) stripped from labels so they can't smuggle
// payloads into the notification body. Built via escapes to keep the source
// free of literal control bytes.
const CONTROL_CHARS = new RegExp("[\u0000-\u001F\u007F]", "g");

/** Strip control chars and cap length so labels can't smuggle payloads. */
function sanitiseLabel(label: string | undefined): string {
  if (!label) return "";
  return label.replace(CONTROL_CHARS, "").trim().slice(0, MAX_LABEL_LENGTH);
}

/** Only internal paths are permitted as deep links. */
function safePath(url: string | undefined): string {
  if (!url) return "/dashboard";
  const cleaned = url.replace(/[\\\s]/g, "");
  return cleaned.startsWith("/") && !cleaned.startsWith("//") ? cleaned : "/dashboard";
}

type Builder = (label: string) => { title: string; body: string };

const BUILDERS: Record<PushNotificationType, Builder> = {
  new_message: (l) => ({
    title: "New message",
    body: l ? `You have a new message from ${l}.` : "You have a new message.",
  }),
  quote_received: (l) => ({
    title: "New quote",
    body: l ? `You received a quote for ${l}.` : "You received a new quote.",
  }),
  booking_confirmed: (l) => ({
    title: "Booking confirmed",
    body: l ? `Your booking for ${l} is confirmed.` : "Your booking is confirmed.",
  }),
  booking_updated: (l) => ({
    title: "Booking updated",
    body: l ? `Your booking for ${l} was updated.` : "Your booking was updated.",
  }),
  offer_received: (l) => ({
    title: "New offer received",
    body: l ? `A new offer was made on ${l}.` : "You received a new offer.",
  }),
  viewing_scheduled: (l) => ({
    title: "Viewing scheduled",
    body: l ? `A viewing was scheduled for ${l}.` : "A viewing was scheduled.",
  }),
  review_posted: (l) => ({
    title: "New review",
    body: l ? `You received a new review from ${l}.` : "You received a new review.",
  }),
};

export function isPushNotificationType(value: unknown): value is PushNotificationType {
  return (
    typeof value === "string" &&
    (PUSH_NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

/** Build the server-side notification message for an allow-listed type. */
export function buildPushNotification(
  type: PushNotificationType,
  data: PushNotificationData = {},
): BuiltPushNotification {
  const label = sanitiseLabel(data.label);
  const { title, body } = BUILDERS[type](label);
  return { title, body, url: safePath(data.url) };
}
