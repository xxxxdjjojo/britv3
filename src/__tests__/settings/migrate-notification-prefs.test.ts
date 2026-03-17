import { describe, it, expect } from "vitest";
import {
  migrateNotificationPrefs,
  NEW_DEFAULTS,
} from "@/lib/notifications/migrate-notification-prefs";

describe("migrateNotificationPrefs", () => {
  // -----------------------------------------------------------------------
  // Empty / null / undefined input → returns NEW_DEFAULTS
  // -----------------------------------------------------------------------
  it("returns NEW_DEFAULTS for null input", () => {
    expect(migrateNotificationPrefs(null)).toEqual(NEW_DEFAULTS);
  });

  it("returns NEW_DEFAULTS for undefined input", () => {
    expect(migrateNotificationPrefs(undefined)).toEqual(NEW_DEFAULTS);
  });

  it("returns NEW_DEFAULTS for empty object input", () => {
    expect(migrateNotificationPrefs({})).toEqual(NEW_DEFAULTS);
  });

  // -----------------------------------------------------------------------
  // Old-shape input → correctly maps to new keys
  // -----------------------------------------------------------------------
  it("maps old-schema keys to new-schema keys", () => {
    const oldShape = {
      email_messages: false,
      push_messages: false,
      email_listings: false,
      push_listings: true,
      email_viewings: false,
      email_marketing: true,
      sms_alerts: true,
    };

    const result = migrateNotificationPrefs(oldShape);

    // Mapped values
    expect(result.messages_email).toBe(false);
    expect(result.messages_push).toBe(false);
    expect(result.property_alerts_email).toBe(false);
    expect(result.property_alerts_push).toBe(true);
    expect(result.viewings_email).toBe(false);
    expect(result.market_reports_email).toBe(true);
    expect(result.messages_sms).toBe(true);

    // Unmapped keys should retain defaults
    expect(result.offers_email).toBe(true);
    expect(result.offers_push).toBe(true);
    expect(result.viewings_inapp).toBe(true);
    expect(result.market_reports_inapp).toBe(true);
  });

  // -----------------------------------------------------------------------
  // New-shape input → preserves as-is
  // -----------------------------------------------------------------------
  it("preserves new-schema values when all 20 keys present", () => {
    const newShape: Record<string, boolean> = {};
    for (const key of Object.keys(NEW_DEFAULTS)) {
      newShape[key] = false; // all off
    }

    const result = migrateNotificationPrefs(newShape);

    for (const key of Object.keys(NEW_DEFAULTS)) {
      expect(result[key]).toBe(false);
    }
  });

  // -----------------------------------------------------------------------
  // Partial new-shape → fills missing keys with defaults
  // -----------------------------------------------------------------------
  it("fills missing new-schema keys with defaults", () => {
    const partial = {
      messages_email: false,
      viewings_push: false,
    };

    const result = migrateNotificationPrefs(partial);

    expect(result.messages_email).toBe(false);
    expect(result.viewings_push).toBe(false);

    // Everything else should be default
    expect(result.property_alerts_email).toBe(NEW_DEFAULTS.property_alerts_email);
    expect(result.offers_sms).toBe(NEW_DEFAULTS.offers_sms);
    expect(result.market_reports_inapp).toBe(NEW_DEFAULTS.market_reports_inapp);
  });

  // -----------------------------------------------------------------------
  // Unmapped old keys → ignored (not in result)
  // -----------------------------------------------------------------------
  it("ignores unknown keys from old schema", () => {
    const oldWithExtra = {
      email_messages: false,
      some_random_old_key: true,
      another_unknown: false,
    };

    const result = migrateNotificationPrefs(oldWithExtra);

    expect(result.messages_email).toBe(false);
    expect("some_random_old_key" in result).toBe(false);
    expect("another_unknown" in result).toBe(false);
    // Should have exactly the 20 new keys
    expect(Object.keys(result).length).toBe(20);
  });

  // -----------------------------------------------------------------------
  // Non-boolean values are ignored
  // -----------------------------------------------------------------------
  it("ignores non-boolean values in old schema", () => {
    const badValues = {
      email_messages: "yes",
      push_messages: 1,
      sms_alerts: null,
    };

    const result = migrateNotificationPrefs(badValues);

    // None of the bad values should override defaults
    expect(result.messages_email).toBe(NEW_DEFAULTS.messages_email);
    expect(result.messages_push).toBe(NEW_DEFAULTS.messages_push);
    expect(result.messages_sms).toBe(NEW_DEFAULTS.messages_sms);
  });

  it("ignores non-boolean values in new schema", () => {
    const badNew = {
      messages_email: "true",
      viewings_push: 0,
    };

    const result = migrateNotificationPrefs(badNew);

    // Has new keys so takes the new-schema path, but non-boolean → defaults
    expect(result.messages_email).toBe(NEW_DEFAULTS.messages_email);
    expect(result.viewings_push).toBe(NEW_DEFAULTS.viewings_push);
  });

  // -----------------------------------------------------------------------
  // Result always has exactly 20 keys
  // -----------------------------------------------------------------------
  it("always returns exactly 20 keys", () => {
    const inputs = [
      null,
      {},
      { email_messages: true },
      { messages_email: false, offers_push: false },
    ];

    for (const input of inputs) {
      const result = migrateNotificationPrefs(input as Record<string, unknown>);
      expect(Object.keys(result).length).toBe(20);
    }
  });
});
