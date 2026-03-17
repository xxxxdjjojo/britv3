export const OLD_TO_NEW_MAP: Record<string, string> = {
  email_messages: "messages_email",
  push_messages: "messages_push",
  email_listings: "property_alerts_email",
  push_listings: "property_alerts_push",
  email_viewings: "viewings_email",
  email_marketing: "marketing_email",
  sms_alerts: "messages_sms",
};

export const NEW_DEFAULTS: Record<string, boolean> = {
  property_alerts_email: true,
  property_alerts_push: true,
  property_alerts_sms: false,
  property_alerts_inapp: true,
  viewings_email: true,
  viewings_push: true,
  viewings_sms: true,
  viewings_inapp: true,
  offers_email: true,
  offers_push: true,
  offers_sms: true,
  offers_inapp: true,
  messages_email: true,
  messages_push: true,
  messages_sms: false,
  messages_inapp: true,
  market_reports_email: false,
  market_reports_push: false,
  market_reports_sms: false,
  market_reports_inapp: true,
};

export const ALLOWED_NOTIFICATION_KEYS = Object.keys(NEW_DEFAULTS);

export function migrateNotificationPrefs(
  raw: Record<string, unknown>,
): Record<string, boolean> {
  const result = { ...NEW_DEFAULTS };

  // If raw has new-shape keys, use them directly
  const hasNewKeys = Object.keys(raw).some((k) => k in NEW_DEFAULTS);
  if (hasNewKeys) {
    for (const [key, val] of Object.entries(raw)) {
      if (key in NEW_DEFAULTS && typeof val === "boolean") {
        result[key] = val;
      }
    }
    return result;
  }

  // Otherwise, map old keys to new
  for (const [oldKey, newKey] of Object.entries(OLD_TO_NEW_MAP)) {
    if (oldKey in raw && typeof raw[oldKey] === "boolean") {
      result[newKey] = raw[oldKey] as boolean;
    }
  }

  // Log unmapped keys
  for (const key of Object.keys(raw)) {
    if (!(key in OLD_TO_NEW_MAP) && !(key in NEW_DEFAULTS)) {
      console.warn(`[notification-migration] Unmapped key: ${key}`);
    }
  }

  return result;
}
