/**
 * Migration-on-read for notification preferences.
 * Converts the old 7-key schema to the new 20-key (5 categories × 4 channels) schema.
 */

const OLD_TO_NEW_MAP: Record<string, string> = {
  email_messages: "messages_email",
  push_messages: "messages_push",
  email_listings: "property_alerts_email",
  push_listings: "property_alerts_push",
  email_viewings: "viewings_email",
  email_marketing: "market_reports_email",
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

/**
 * Accepts raw notification preferences (old or new schema) and returns
 * a fully-populated 20-key object using the new schema.
 *
 * - If the input already has new-schema keys, those values are preserved
 *   and any missing keys are filled with defaults.
 * - If the input only has old-schema keys, they are mapped to the
 *   corresponding new keys; everything else gets defaults.
 * - Empty/null input returns NEW_DEFAULTS.
 */
export function migrateNotificationPrefs(
  raw: Record<string, unknown> | null | undefined,
): Record<string, boolean> {
  const result = { ...NEW_DEFAULTS };

  if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) {
    return result;
  }

  // Check if any key belongs to the new schema
  const hasNewKeys = Object.keys(raw).some((k) => k in NEW_DEFAULTS);

  if (hasNewKeys) {
    for (const [key, val] of Object.entries(raw)) {
      if (key in NEW_DEFAULTS && typeof val === "boolean") {
        result[key] = val;
      }
    }
    return result;
  }

  // Old schema — map to new keys
  for (const [oldKey, newKey] of Object.entries(OLD_TO_NEW_MAP)) {
    if (oldKey in raw && typeof raw[oldKey] === "boolean") {
      result[newKey] = raw[oldKey] as boolean;
    }
  }

  return result;
}
