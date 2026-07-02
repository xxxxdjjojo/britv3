import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (before importing the service under test)
// ---------------------------------------------------------------------------

vi.mock("@/services/notifications/email-service", () => ({
  sendCriticalEmail: vi.fn().mockResolvedValue({ sent: true }),
  sendGuestQuoteEmail: vi.fn().mockResolvedValue({ sent: true }),
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

// The rfq branch must resolve the recipient via the SERVICE-ROLE client: the
// caller is the quoting provider, whose RLS grant on service_requests requires
// status='open' — already flipped to 'quotes_received' before the event fires.
const { adminFrom } = vi.hoisted(() => ({ adminFrom: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: adminFrom })),
}));

import {
  createPlatformEvent,
  getUserEntityIds,
} from "@/services/notifications/notification-service";
import {
  sendCriticalEmail,
  sendGuestQuoteEmail,
} from "@/services/notifications/email-service";

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
  it("emails the guest contact_email (guest template) via the admin client when the RFQ has no owner", async () => {
    const eventsBuilder = makeTableBuilder({
      single: mockSingleResult(RFQ_EVENT_ROW),
    });
    const actorNamesBuilder = makeTableBuilder({
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
    // Caller (provider) client: platform_events insert + actor-name lookup only
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return actorNamesBuilder;
      return eventsBuilder;
    });
    // Service-role client serves the service_requests recipient lookup
    adminFrom.mockImplementation(() => rfqBuilder);

    await createPlatformEvent({ from } as never, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: "rfq-1",
      actor_id: "prov-1",
    });
    await flushAsync();

    // The rfq lookup must use the ADMIN client — the provider's own client
    // cannot read a service_request once its status leaves 'open'.
    expect(adminFrom).toHaveBeenCalledWith("service_requests");
    expect(from).not.toHaveBeenCalledWith("service_requests");
    expect(sendGuestQuoteEmail).toHaveBeenCalledTimes(1);
    expect(sendGuestQuoteEmail).toHaveBeenCalledWith(
      "jane@example.com",
      expect.stringContaining("sent you a quote"),
      expect.objectContaining({ entity_id: "rfq-1" }),
    );
    expect(sendCriticalEmail).not.toHaveBeenCalled();
  });

  it("emails the RFQ owner's profile email for authed RFQs (looked up via the admin client)", async () => {
    const eventsBuilder = makeTableBuilder({
      single: mockSingleResult(RFQ_EVENT_ROW),
    });
    // Caller-client profiles read = resolveActorNames (awaited list) only.
    const actorNamesBuilder = makeTableBuilder({
      then: mockListResult([
        { id: "prov-1", display_name: "Richards Plumbing" },
      ]),
    });
    // Admin-client profiles read = the recipient email lookup (.single()).
    const recipientProfileBuilder = makeTableBuilder({
      single: mockSingleResult({
        email: "owner@test.com",
        display_name: "Owner",
        notification_preferences: null,
      }),
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
      if (table === "profiles") return actorNamesBuilder;
      return eventsBuilder;
    });
    adminFrom.mockImplementation((table: string) =>
      table === "profiles" ? recipientProfileBuilder : rfqBuilder,
    );

    await createPlatformEvent({ from } as never, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: "rfq-1",
      actor_id: "prov-1",
    });
    await flushAsync();

    expect(adminFrom).toHaveBeenCalledWith("service_requests");
    expect(adminFrom).toHaveBeenCalledWith("profiles");
    expect(from).not.toHaveBeenCalledWith("service_requests");
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
      return eventsBuilder;
    });
    adminFrom.mockImplementation(() => rfqBuilder);

    await createPlatformEvent({ from } as never, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: "rfq-1",
      actor_id: "owner-1",
    });
    await flushAsync();

    expect(sendCriticalEmail).not.toHaveBeenCalled();
    expect(sendGuestQuoteEmail).not.toHaveBeenCalled();
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
