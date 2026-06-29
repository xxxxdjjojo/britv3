import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

// Avoid pulling the Resend SDK / brand config side-effects into this unit test.
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: vi.fn() } };
  }),
}));

import { checkUserEmailPref, PREF_KEY_TO_EMAIL_COLUMN } from "./email-service";

/**
 * Build a chainable Supabase stub whose
 *   .from("profiles").select(...).eq("id", userId).single()
 * resolves to the supplied row / error.
 */
function buildClient(result: {
  data?: { notification_preferences?: unknown; preferences?: unknown } | null;
  error?: unknown;
}) {
  const single = vi.fn(async () => ({
    data: result.data ?? null,
    error: result.error ?? null,
  }));
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from, select, eq, single } as const;
}

describe("checkUserEmailPref", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when the mapped flat email key is false", async () => {
    const client = buildClient({
      data: { notification_preferences: { market_reports_email: false }, preferences: null },
    });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_marketing")).toBe(false);
  });

  it("returns true when the mapped flat email key is true", async () => {
    const client = buildClient({
      data: { notification_preferences: { market_reports_email: true }, preferences: null },
    });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_marketing")).toBe(true);
  });

  it("returns true when the mapped flat email key is absent (default enabled)", async () => {
    const client = buildClient({
      data: { notification_preferences: {}, preferences: null },
    });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_marketing")).toBe(true);
  });

  it("returns false when globally unsubscribed, regardless of the toggle", async () => {
    const client = buildClient({
      data: {
        notification_preferences: { market_reports_email: true },
        preferences: { digest_frequency: "never" },
      },
    });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_marketing")).toBe(false);
  });

  it("fails open (true) when the profiles row is missing", async () => {
    const client = buildClient({ data: null });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_marketing")).toBe(true);
  });

  it("fails open (true) when the query errors", async () => {
    const client = buildClient({ error: { message: "boom" } });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_marketing")).toBe(true);
  });

  it("returns true for unmapped keys (email_reviews, email_billing) when not globally unsubscribed", async () => {
    const client = buildClient({
      data: { notification_preferences: { market_reports_email: false }, preferences: null },
    });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_reviews")).toBe(true);
    expect(await checkUserEmailPref("u1", "email_billing")).toBe(true);
  });

  it("suppresses unmapped keys when globally unsubscribed", async () => {
    const client = buildClient({
      data: { notification_preferences: {}, preferences: { digest_frequency: "never" } },
    });
    createClientMock.mockResolvedValue(client as never);

    expect(await checkUserEmailPref("u1", "email_reviews")).toBe(false);
    expect(await checkUserEmailPref("u1", "email_billing")).toBe(false);
  });

  it("maps each prefKey to its flat email column via PREF_KEY_TO_EMAIL_COLUMN", async () => {
    for (const [prefKey, column] of Object.entries(PREF_KEY_TO_EMAIL_COLUMN)) {
      const client = buildClient({
        data: { notification_preferences: { [column]: false }, preferences: null },
      });
      createClientMock.mockResolvedValue(client as never);

      expect(await checkUserEmailPref("u1", prefKey)).toBe(false);
    }
  });

  it("exposes the expected mapping", () => {
    expect(PREF_KEY_TO_EMAIL_COLUMN).toEqual({
      email_marketing: "market_reports_email",
      email_property_alerts: "property_alerts_email",
      email_viewing_reminders: "viewings_email",
      email_offers: "offers_email",
      email_messages: "messages_email",
      email_enquiries: "messages_email",
      email_digest: "market_reports_email",
    });
  });
});
