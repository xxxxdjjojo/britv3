/**
 * Tests for POST /api/admin/billing/replay/:event_id.
 *
 * Coverage:
 *  - Valid HMAC + admin → 200 + enqueues Inngest event
 *  - Missing / invalid HMAC → 401 (without consulting admin guard)
 *  - Missing timestamp header → 401
 *  - Stale timestamp (>5 min) → 401
 *  - Tampered timestamp (signature for a different timestamp) → 401
 *  - Tampered payload (HMAC for a different event_id) → 401
 *  - Non-admin caller → 403
 *  - Non-existent event_id → 404
 *  - Missing REPLAY_SIGNING_SECRET → 503
 *  - Connect event types include a warning in the response
 */

import crypto from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Module mocks (must be declared before route import)
// ---------------------------------------------------------------------------

vi.mock("@/lib/admin-guard", () => ({
  adminOnly: vi.fn(),
  adminWithPermission: vi.fn(),
}));

vi.mock("@/lib/admin-audit", () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: vi.fn(),
  getErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : String(err),
}));

const inngestSend = vi.fn().mockResolvedValue({ ids: ["evt-id"] });
vi.mock("@/inngest/client", () => ({
  inngest: { send: inngestSend },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECRET = "test-secret-32-byte-hex-deadbeef";
const EVENT_ID = "evt_test_replay_001";

function currentTimestamp(): string {
  return String(Math.floor(Date.now() / 1000));
}

function signFor(eventId: string, timestamp: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${timestamp}.${eventId}`)
    .digest("hex");
}

function makeSignedRequest(
  eventId: string,
  options: {
    signature?: string | null;
    timestamp?: string | null;
  } = {},
): Request {
  const headers: Record<string, string> = {};
  if (options.signature !== null && options.signature !== undefined) {
    headers["x-replay-signature"] = options.signature;
  }
  if (options.timestamp !== null && options.timestamp !== undefined) {
    headers["x-replay-timestamp"] = options.timestamp;
  }

  return new Request(`http://localhost/api/admin/billing/replay/${eventId}`, {
    method: "POST",
    headers,
  });
}

function makeValidRequest(eventId: string): Request {
  const ts = currentTimestamp();
  return makeSignedRequest(eventId, {
    timestamp: ts,
    signature: signFor(eventId, ts),
  });
}

type SupabaseRowResult = {
  data: unknown | null;
  error: { message: string } | null;
};

function makeAdminSupabase(billingEventRow: SupabaseRowResult) {
  const maybeSingle = vi.fn().mockResolvedValue(billingEventRow);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from, _maybeSingle: maybeSingle };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/admin/billing/replay/:event_id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.REPLAY_SIGNING_SECRET = SECRET;
  });

  it("returns 503 when REPLAY_SIGNING_SECRET is not configured", async () => {
    delete process.env.REPLAY_SIGNING_SECRET;
    const { POST } = await import("../route");
    const req = makeValidRequest(EVENT_ID);

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: "Replay endpoint not configured" });
  });

  it("returns 401 when x-replay-signature header is missing", async () => {
    const { POST } = await import("../route");
    const req = makeSignedRequest(EVENT_ID, {
      timestamp: currentTimestamp(),
      signature: null,
    });

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid replay signature" });
  });

  it("returns 401 when x-replay-timestamp header is missing", async () => {
    const { POST } = await import("../route");
    const ts = currentTimestamp();
    const req = makeSignedRequest(EVENT_ID, {
      timestamp: null,
      signature: signFor(EVENT_ID, ts),
    });

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 when timestamp is stale (older than 5 minutes)", async () => {
    const { POST } = await import("../route");
    const staleTs = String(Math.floor(Date.now() / 1000) - 301);
    const req = makeSignedRequest(EVENT_ID, {
      timestamp: staleTs,
      signature: signFor(EVENT_ID, staleTs),
    });

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 when signature is for a different timestamp (tampered)", async () => {
    const { POST } = await import("../route");
    const realTs = currentTimestamp();
    const otherTs = String(Math.floor(Date.now() / 1000) - 60);
    const req = makeSignedRequest(EVENT_ID, {
      timestamp: realTs,
      signature: signFor(EVENT_ID, otherTs),
    });

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 when x-replay-signature is invalid", async () => {
    const { POST } = await import("../route");
    const req = makeSignedRequest(EVENT_ID, {
      timestamp: currentTimestamp(),
      signature: "deadbeef".repeat(8),
    });

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 when HMAC is computed for a different event_id (tampered)", async () => {
    const { POST } = await import("../route");
    const ts = currentTimestamp();
    // Signature is valid — but for a different event_id than the route param.
    const sigForOtherId = signFor("evt_some_other_event", ts);
    const req = makeSignedRequest(EVENT_ID, {
      timestamp: ts,
      signature: sigForOtherId,
    });

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not an admin", async () => {
    const { adminWithPermission } = await import("@/lib/admin-guard");
    vi.mocked(adminWithPermission).mockResolvedValue(
      Response.json({ error: "Forbidden" }, { status: 403 }),
    );

    const { POST } = await import("../route");
    const req = makeValidRequest(EVENT_ID);

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(403);
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("returns 404 when the billing event does not exist", async () => {
    const supabase = makeAdminSupabase({ data: null, error: null });
    const { adminWithPermission } = await import("@/lib/admin-guard");
    vi.mocked(adminWithPermission).mockResolvedValue({
      user: { id: "admin-1" },
      supabase,
      adminRole: "super_admin",
    } as never);

    const { POST } = await import("../route");
    const req = makeValidRequest(EVENT_ID);

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(404);
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("enqueues an Inngest replay event on success", async () => {
    const row = {
      stripe_event_id: EVENT_ID,
      event_type: "customer.subscription.updated",
      payload: { id: "sub_xyz", customer: "cus_xyz" },
    };
    const supabase = makeAdminSupabase({ data: row, error: null });

    const { adminWithPermission } = await import("@/lib/admin-guard");
    vi.mocked(adminWithPermission).mockResolvedValue({
      user: { id: "admin-99" },
      supabase,
      adminRole: "super_admin",
    } as never);

    const { POST } = await import("../route");
    const req = makeValidRequest(EVENT_ID);

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ enqueued: true, event_id: EVENT_ID });

    expect(inngestSend).toHaveBeenCalledTimes(1);
    expect(inngestSend).toHaveBeenCalledWith({
      name: "billing/webhook.handler_failed",
      data: {
        eventId: EVENT_ID,
        eventType: "customer.subscription.updated",
        errorMessage: "Manual admin replay",
        payload: row.payload,
        account: null,
        attempt: 0,
      },
    });
  });

  it("includes a warning for Connect event types (payout.*, account.updated)", async () => {
    const row = {
      stripe_event_id: EVENT_ID,
      event_type: "payout.paid",
      payload: { id: "po_xyz" },
    };
    const supabase = makeAdminSupabase({ data: row, error: null });

    const { adminWithPermission } = await import("@/lib/admin-guard");
    vi.mocked(adminWithPermission).mockResolvedValue({
      user: { id: "admin-99" },
      supabase,
      adminRole: "super_admin",
    } as never);

    const { POST } = await import("../route");
    const req = makeValidRequest(EVENT_ID);

    const res = await POST(req, {
      params: Promise.resolve({ event_id: EVENT_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enqueued).toBe(true);
    expect(body.event_id).toBe(EVENT_ID);
    expect(typeof body.warning).toBe("string");
    expect(body.warning).toMatch(/connect event/i);
  });
});
