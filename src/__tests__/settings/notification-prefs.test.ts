import { describe, expect, it, vi } from "vitest";
import {
  migrateNotificationPrefs,
  NEW_DEFAULTS,
  OLD_TO_NEW_MAP,
} from "@/lib/settings/notification-prefs";

describe("migrateNotificationPrefs", () => {
  it("maps old-shape input to new keys correctly", () => {
    const oldShape = {
      email_messages: true,
      push_messages: false,
      email_listings: true,
      sms_alerts: true,
    };

    const result = migrateNotificationPrefs(oldShape);

    // Mapped keys
    expect(result.messages_email).toBe(true);
    expect(result.messages_push).toBe(false);
    expect(result.property_alerts_email).toBe(true);
    expect(result.messages_sms).toBe(true);

    // Unmapped keys should retain defaults
    expect(result.viewings_email).toBe(NEW_DEFAULTS.viewings_email);
    expect(result.offers_push).toBe(NEW_DEFAULTS.offers_push);
    expect(result.market_reports_email).toBe(NEW_DEFAULTS.market_reports_email);

    // Should have all 20 keys
    expect(Object.keys(result).sort()).toEqual(
      Object.keys(NEW_DEFAULTS).sort(),
    );
  });

  it("uses new-shape input directly and fills rest with defaults", () => {
    const newShape = {
      messages_email: false,
      viewings_push: false,
    };

    const result = migrateNotificationPrefs(newShape);

    expect(result.messages_email).toBe(false);
    expect(result.viewings_push).toBe(false);

    // Rest should be defaults
    expect(result.property_alerts_email).toBe(true);
    expect(result.offers_email).toBe(true);
    expect(result.market_reports_inapp).toBe(true);

    expect(Object.keys(result).sort()).toEqual(
      Object.keys(NEW_DEFAULTS).sort(),
    );
  });

  it("returns NEW_DEFAULTS exactly for empty object input", () => {
    const result = migrateNotificationPrefs({});
    expect(result).toEqual(NEW_DEFAULTS);
  });

  it("fills missing keys with defaults for partial new-shape input", () => {
    const partial = {
      property_alerts_email: false,
      property_alerts_push: false,
      viewings_email: false,
    };

    const result = migrateNotificationPrefs(partial);

    // Provided keys
    expect(result.property_alerts_email).toBe(false);
    expect(result.property_alerts_push).toBe(false);
    expect(result.viewings_email).toBe(false);

    // Missing keys filled with defaults
    expect(result.property_alerts_sms).toBe(false); // default is false
    expect(result.property_alerts_inapp).toBe(true); // default is true
    expect(result.offers_email).toBe(true);
    expect(result.messages_inapp).toBe(true);

    expect(Object.keys(result)).toHaveLength(Object.keys(NEW_DEFAULTS).length);
  });

  it("warns about unmapped old keys without crashing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = {
      some_unknown_key: true,
      email_messages: false,
    };

    const result = migrateNotificationPrefs(input);

    // email_messages should be mapped
    expect(result.messages_email).toBe(false);

    // Should have warned about unknown key
    expect(warnSpy).toHaveBeenCalledWith(
      "[notification-migration] Unmapped key: some_unknown_key",
    );

    // Should still return full 20-key object
    expect(Object.keys(result)).toHaveLength(Object.keys(NEW_DEFAULTS).length);

    warnSpy.mockRestore();
  });

  it("ignores non-boolean values in old-shape input", () => {
    const input = {
      email_messages: "yes" as unknown,
      push_messages: true,
    };

    const result = migrateNotificationPrefs(
      input as Record<string, unknown>,
    );

    // "yes" is not boolean, so messages_email should stay at default
    expect(result.messages_email).toBe(NEW_DEFAULTS.messages_email);
    // true is boolean, so messages_push should be mapped
    expect(result.messages_push).toBe(true);
  });

  it("ignores non-boolean values in new-shape input", () => {
    const input = {
      messages_email: 1 as unknown,
      viewings_push: false,
    };

    const result = migrateNotificationPrefs(
      input as Record<string, unknown>,
    );

    // 1 is not boolean, should stay at default
    expect(result.messages_email).toBe(NEW_DEFAULTS.messages_email);
    expect(result.viewings_push).toBe(false);
  });

  it("maps all OLD_TO_NEW_MAP entries correctly", () => {
    // Build an old-shape object with all old keys set to true
    const allOld: Record<string, boolean> = {};
    for (const key of Object.keys(OLD_TO_NEW_MAP)) {
      allOld[key] = true;
    }

    const result = migrateNotificationPrefs(allOld);

    for (const [, newKey] of Object.entries(OLD_TO_NEW_MAP)) {
      expect(result[newKey]).toBe(true);
    }
  });
});
