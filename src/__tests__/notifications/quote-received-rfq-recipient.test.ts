import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (before importing the service under test)
// ---------------------------------------------------------------------------

vi.mock("@/services/notifications/email-service", () => ({
  sendCriticalEmail: vi.fn().mockResolvedValue({ sent: true }),
  shouldSendEmail: vi.fn().mockReturnValue(true),
  sendDailyDigest: vi.fn().mockResolvedValue({ sent: true }),
  sendProviderRfqEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

vi.mock("@/lib/cache/redis", () => ({
  redis: null,
  createRateLimiter: vi.fn(() => ({
    limit: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

import {
  createPlatformEvent,
  getUserEntityIds,
} from "@/services/notifications/notification-service";
import { sendCriticalEmail } from "@/services/notifications/email-service";

// ---------------------------------------------------------------------------
// Helpers (chainable builder, mirrors src/__tests__/services/notification-service.test.ts)
// ---------------------------------------------------------------------------

function mockSingleResult(data: Record<string, unknown> | null) {
  return { data, error: null, count: null, status: 200, statusText: "OK" };
}

function mockListResult(data: Record<string, unknown>[]) {
  return { data, error: null, count: null, status: 200, statusText: "OK" };
}

function makeTableBuilder(opts: { single?: unknown; then?: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of [
    "select", "insert", "update", "upsert", "delete", "eq", "neq", "gt",
    "gte", "lt", "lte", "like", "ilike", "is", "in", "or", "order", "limit",
  ]) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi
    .fn()
    .mockResolvedValue(opts.single ?? mockSingleResult({}));
  builder.maybeSingle = vi
    .fn()
    .mockResolvedValue(opts.single ?? mockSingleResult({}));
  builder.then = vi.fn((resolve: (v: unknown) => void) =>
    resolve(opts.then ?? mockListResult([])),
  );
  return builder;
}

const RFQ_EVENT_ROW = {
  id: 2,
  event_type: "quote_received",
  entity_type: "rfq",
  entity_id: "rfq-1",
  actor_id: "prov-1",
  metadata: {},
  created_at: new Date().toISOString(),
};

/** Flush the fire-and-forget dispatchCriticalEmail microtask chain. */
async function flushAsync() {
  for (let i = 0; i < 10; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// dispatchCriticalEmail rfq branch (via createPlatformEvent)
// ---------------------------------------------------------------------------

describe("quote_received rfq recipient resolution", () => {
  it("emails the guest contact_email directly when the RFQ has no owner", async () => {
    const eventsBuilder = makeTableBuilder({
      single: mockSingleResult(RFQ_EVENT_ROW),
    });
    const profilesBuilder = makeTableBuilder({
      then: mockListResult([
        { id: "prov-1", display_name: "Richards Plumbing" },
      ]),
    });
    const rfqBuilder = makeTableBuilder({
      single: mockSingleResult({
        user_id: null,
        contact_email: "jane@example.com",
        contact_name: "Jane Smith",
        title: "Fix leaking kitchen tap",
      }),
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return profilesBuilder;
      if (table === "service_requests") return rfqBuilder;
      return eventsBuilder;
    });

    await createPlatformEvent({ from } as never, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: "rfq-1",
      actor_id: "prov-1",
    });
    await flushAsync();

    expect(from).toHaveBeenCalledWith("service_requests");
    expect(sendCriticalEmail).toHaveBeenCalledTimes(1);
    expect(sendCriticalEmail).toHaveBeenCalledWith(
      "jane@example.com",
      expect.stringContaining("sent you a quote"),
      expect.objectContaining({ entity_id: "rfq-1" }),
    );
  });

  it("emails the RFQ owner's profile email for authed RFQs", async () => {
    const eventsBuilder = makeTableBuilder({
      single: mockSingleResult(RFQ_EVENT_ROW),
    });
    // profiles serves both resolveActorNames (awaited list) and the
    // recipient email lookup (.single()).
    const profilesBuilder = makeTableBuilder({
      then: mockListResult([
        { id: "prov-1", display_name: "Richards Plumbing" },
      ]),
    });
    profilesBuilder.single = vi.fn().mockResolvedValue(
      mockSingleResult({
        email: "owner@test.com",
        display_name: "Owner",
        notification_preferences: null,
      }),
    );
    const rfqBuilder = makeTableBuilder({
      single: mockSingleResult({
        user_id: "owner-1",
        contact_email: null,
        contact_name: null,
        title: "Fix leaking kitchen tap",
      }),
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return profilesBuilder;
      if (table === "service_requests") return rfqBuilder;
      return eventsBuilder;
    });

    await createPlatformEvent({ from } as never, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: "rfq-1",
      actor_id: "prov-1",
    });
    await flushAsync();

    expect(sendCriticalEmail).toHaveBeenCalledTimes(1);
    expect(sendCriticalEmail).toHaveBeenCalledWith(
      "owner@test.com",
      expect.any(String),
      expect.objectContaining({ entity_id: "rfq-1" }),
    );
  });

  it("does not email when the RFQ owner is the actor", async () => {
    const eventsBuilder = makeTableBuilder({
      single: mockSingleResult({ ...RFQ_EVENT_ROW, actor_id: "owner-1" }),
    });
    const profilesBuilder = makeTableBuilder({
      then: mockListResult([{ id: "owner-1", display_name: "Owner" }]),
    });
    const rfqBuilder = makeTableBuilder({
      single: mockSingleResult({
        user_id: "owner-1",
        contact_email: null,
        contact_name: null,
        title: "Fix leaking kitchen tap",
      }),
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return profilesBuilder;
      if (table === "service_requests") return rfqBuilder;
      return eventsBuilder;
    });

    await createPlatformEvent({ from } as never, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: "rfq-1",
      actor_id: "owner-1",
    });
    await flushAsync();

    expect(sendCriticalEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getUserEntityIds includes owned service_requests
// ---------------------------------------------------------------------------

describe("getUserEntityIds", () => {
  it("includes the user's service_requests so quote_received events surface in the feed", async () => {
    const emptyBuilder = makeTableBuilder({ then: mockListResult([]) });
    const rfqBuilder = makeTableBuilder({
      then: mockListResult([{ id: "rfq-1" }, { id: "rfq-2" }]),
    });
    const from = vi.fn().mockImplementation((table: string) =>
      table === "service_requests" ? rfqBuilder : emptyBuilder,
    );

    const entityIds = await getUserEntityIds({ from } as never, "user-1");

    expect(from).toHaveBeenCalledWith("service_requests");
    expect(rfqBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(entityIds).toContain("rfq-1");
    expect(entityIds).toContain("rfq-2");
  });
});
