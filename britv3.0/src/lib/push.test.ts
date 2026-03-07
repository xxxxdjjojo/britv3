import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-public-key",
    VAPID_PRIVATE_KEY: "test-private-key",
    VAPID_SUBJECT: "mailto:test@example.com",
  };
});

describe("getVapidPublicKey", () => {
  it("returns the NEXT_PUBLIC_VAPID_PUBLIC_KEY env var", async () => {
    const { getVapidPublicKey } = await import("@/lib/push");
    expect(getVapidPublicKey()).toBe("test-public-key");
  });

  it("returns undefined when env var is not set", async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const { getVapidPublicKey } = await import("@/lib/push");
    expect(getVapidPublicKey()).toBeUndefined();
  });
});

describe("sendPushNotification", () => {
  const validSubscription = {
    endpoint: "https://push.example.com/test-endpoint",
    keys: {
      p256dh: "test-p256dh-key",
      auth: "test-auth-key",
    },
  };

  const validPayload = {
    title: "Test Notification",
    body: "Test notification body",
    url: "/properties/123",
  };

  it("calls webpush.sendNotification with JSON-stringified payload", async () => {
    const webpush = await import("web-push");
    const mockSendNotification = vi.mocked(
      (webpush.default as { sendNotification: ReturnType<typeof vi.fn> })
        .sendNotification,
    );
    mockSendNotification.mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof mockSendNotification>>,
    );

    const { sendPushNotification } = await import("@/lib/push");
    const result = await sendPushNotification(validSubscription, validPayload);

    expect(mockSendNotification).toHaveBeenCalledWith(
      validSubscription,
      JSON.stringify(validPayload),
    );
    expect(result).toEqual({ success: true });
  });

  it("returns success: true on successful notification delivery", async () => {
    const webpush = await import("web-push");
    const mockSendNotification = vi.mocked(
      (webpush.default as { sendNotification: ReturnType<typeof vi.fn> })
        .sendNotification,
    );
    mockSendNotification.mockResolvedValueOnce(
      {} as Awaited<ReturnType<typeof mockSendNotification>>,
    );

    const { sendPushNotification } = await import("@/lib/push");
    const result = await sendPushNotification(validSubscription, validPayload);

    expect(result).toEqual({ success: true });
  });

  it("deletes expired subscription and returns success: false on 410 error", async () => {
    const webpush = await import("web-push");
    const mockSendNotification = vi.mocked(
      (webpush.default as { sendNotification: ReturnType<typeof vi.fn> })
        .sendNotification,
    );
    const expiredError = Object.assign(new Error("Gone"), { statusCode: 410 });
    mockSendNotification.mockRejectedValueOnce(expiredError);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const mockDeleteFn = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        delete: mockDeleteFn,
      })),
    } as ReturnType<typeof createAdminClient>);

    const { sendPushNotification } = await import("@/lib/push");
    const result = await sendPushNotification(validSubscription, validPayload);

    expect(result).toEqual({ success: false, reason: "expired" });
    expect(mockDeleteFn).toHaveBeenCalled();
  });

  it("re-throws non-410 errors", async () => {
    const webpush = await import("web-push");
    const mockSendNotification = vi.mocked(
      (webpush.default as { sendNotification: ReturnType<typeof vi.fn> })
        .sendNotification,
    );
    const networkError = Object.assign(new Error("Network Error"), {
      statusCode: 500,
    });
    mockSendNotification.mockRejectedValueOnce(networkError);

    const { sendPushNotification } = await import("@/lib/push");

    await expect(
      sendPushNotification(validSubscription, validPayload),
    ).rejects.toThrow("Network Error");
  });
});
