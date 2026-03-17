import { describe, it, expect } from "vitest";
import {
  migrateNotificationPrefs,
  NEW_DEFAULTS,
} from "@/lib/notifications/migrate-notification-prefs";

/**
 * These tests verify the "single-key update" behavior:
 * - The client sends `{ [key]: value }` (one key), not the full object.
 * - The server merges that single key into the migrated existing prefs.
 *
 * We simulate the server-side merge logic here without needing Supabase.
 */

function simulatePutMerge(
  existingRaw: Record<string, unknown>,
  updatePayload: Record<string, boolean>,
): Record<string, boolean> {
  const migrated = migrateNotificationPrefs(existingRaw);
  return { ...migrated, ...updatePayload };
}

describe("notification single-key update", () => {
  it("sending { messages_email: false } only changes that key", () => {
    const existing = { ...NEW_DEFAULTS };
    const result = simulatePutMerge(existing, { messages_email: false });

    expect(result.messages_email).toBe(false);

    // Everything else unchanged
    for (const [key, val] of Object.entries(NEW_DEFAULTS)) {
      if (key !== "messages_email") {
        expect(result[key]).toBe(val);
      }
    }
  });

  it("sending { offers_sms: false } only changes that key", () => {
    const existing = { ...NEW_DEFAULTS };
    const result = simulatePutMerge(existing, { offers_sms: false });

    expect(result.offers_sms).toBe(false);
    expect(result.offers_email).toBe(NEW_DEFAULTS.offers_email);
    expect(result.offers_push).toBe(NEW_DEFAULTS.offers_push);
    expect(result.offers_inapp).toBe(NEW_DEFAULTS.offers_inapp);
  });

  it("single-key update on migrated old-schema prefs preserves migration", () => {
    const oldPrefs = {
      email_messages: false,
      push_messages: true,
      email_listings: true,
      push_listings: false,
      email_viewings: true,
      email_marketing: false,
      sms_alerts: true,
    };

    // Toggle viewings_sms to false
    const result = simulatePutMerge(oldPrefs, { viewings_sms: false });

    // The toggled key
    expect(result.viewings_sms).toBe(false);

    // Migrated old values should still be present
    expect(result.messages_email).toBe(false); // from email_messages
    expect(result.messages_push).toBe(true); // from push_messages
    expect(result.property_alerts_email).toBe(true); // from email_listings
    expect(result.messages_sms).toBe(true); // from sms_alerts
  });

  it("bulk marketing unsubscribe sets all market_reports_* to false", () => {
    const existing = { ...NEW_DEFAULTS };
    const marketingOff = {
      market_reports_email: false,
      market_reports_push: false,
      market_reports_sms: false,
      market_reports_inapp: false,
    };

    const result = simulatePutMerge(existing, marketingOff);

    expect(result.market_reports_email).toBe(false);
    expect(result.market_reports_push).toBe(false);
    expect(result.market_reports_sms).toBe(false);
    expect(result.market_reports_inapp).toBe(false);

    // Other categories untouched
    expect(result.messages_email).toBe(NEW_DEFAULTS.messages_email);
    expect(result.viewings_push).toBe(NEW_DEFAULTS.viewings_push);
  });

  it("result always has exactly 20 keys after single-key update", () => {
    const result = simulatePutMerge(
      { ...NEW_DEFAULTS },
      { property_alerts_push: false },
    );
    expect(Object.keys(result).length).toBe(20);
  });
});
