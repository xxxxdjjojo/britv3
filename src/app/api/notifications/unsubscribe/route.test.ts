import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClientMock, verifyTokenMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  verifyTokenMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/unsubscribe-token", () => ({
  verifyUnsubscribeToken: verifyTokenMock,
}));

import { POST } from "./route";

/**
 * Stub the service-role client used by the route:
 *   profiles.select("notification_preferences, preferences").eq("id", id).single()
 *   profiles.update({...}).eq("id", id)
 */
function buildClient(existing: {
  preferences?: unknown;
  notification_preferences?: unknown;
}) {
  const updateEq = vi.fn(async () => ({ error: null }));
  const update = vi.fn((_payload: Record<string, unknown>) => ({ eq: updateEq }));
  const single = vi.fn(async () => ({
    data: {
      preferences: existing.preferences ?? null,
      notification_preferences: existing.notification_preferences ?? null,
    },
    error: null,
  }));
  const selectEq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq: selectEq }));
  const from = vi.fn(() => ({ select, update }));
  return { from, update, updateEq } as const;
}

function makeRequest() {
  return new NextRequest("https://truedeed.co.uk/api/notifications/unsubscribe?token=abc");
}

describe("POST /api/notifications/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyTokenMock.mockReturnValue({ valid: true, userId: "u1" });
  });

  it("flips every *_email key in notification_preferences to false", async () => {
    const client = buildClient({
      notification_preferences: {
        property_alerts_email: true,
        property_alerts_push: true,
        viewings_email: true,
        viewings_inapp: true,
        market_reports_email: true,
      },
    });
    createServerClientMock.mockReturnValue(client as never);

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    expect(client.update).toHaveBeenCalledTimes(1);
    const updatePayload = client.update.mock.calls[0]![0] as {
      notification_preferences: Record<string, boolean>;
    };

    // Every *_email key is now false…
    expect(updatePayload.notification_preferences.property_alerts_email).toBe(false);
    expect(updatePayload.notification_preferences.viewings_email).toBe(false);
    expect(updatePayload.notification_preferences.market_reports_email).toBe(false);
    // …and non-email keys are preserved (merge, not clobber).
    expect(updatePayload.notification_preferences.property_alerts_push).toBe(true);
    expect(updatePayload.notification_preferences.viewings_inapp).toBe(true);
  });

  it("still sets the nested preferences global-unsub signal", async () => {
    const client = buildClient({ notification_preferences: { messages_email: true } });
    createServerClientMock.mockReturnValue(client as never);

    await POST(makeRequest());

    const updatePayload = client.update.mock.calls[0]![0] as {
      preferences: { digest_frequency: string };
    };
    expect(updatePayload.preferences.digest_frequency).toBe("never");
  });

  it("rejects a missing token", async () => {
    const req = new NextRequest("https://truedeed.co.uk/api/notifications/unsubscribe");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects an invalid token", async () => {
    verifyTokenMock.mockReturnValue({ valid: false, reason: "invalid" });
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });
});
