/**
 * Tests for POST /api/admin/billing/replay/:event_id.
 *
 * Coverage:
 *  - Valid HMAC + admin → 200 + enqueues Inngest event
 *  - Missing / invalid HMAC → 401 (without consulting admin guard)
 *  - Tampered payload (HMAC for a different event_id) → 401
 *  - Non-admin caller → 403
 *  - Non-existent event_id → 404
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

const inngestSend = vi.fn().mockResolvedValue({ ids: ["evt-id"] });
vi.mock("@/inngest/client", () => ({
  inngest: { send: inngestSend },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECRET = "test-secret-32-byte-hex-deadbeef";
const EVENT_ID = "evt_test_replay_001";

function makeSignedRequest(eventId: string, signature?: string | null): Request {
  const headers: Record<string, string> = {};
  if (signature !== null && signature !== undefined) {
    headers["x-replay-signature"] = signature;
  }

  return new Request(`http://localhost/api/admin/billing/replay/${eventId}`, {
    method: "POST",
    headers,
  });
}

function validSignature(eventId: string): string {
  return crypto.createHmac("sha256", SECRET).update(eventId).digest("hex");
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

  it("returns 401 when x-replay-signature header is missing", async () => {
    const { POST } = await import("../route");
    const req = makeSignedRequest(EVENT_ID, null);

    const res = await POST(req, { params: Promise.resolve({ event_id: EVENT_ID }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid replay signature" });
  });

  it("returns 401 when x-replay-signature is invalid", async () => {
    const { POST } = await import("../route");
    const req = makeSignedRequest(EVENT_ID, "deadbeef".repeat(8));

    const res = await POST(req, { params: Promise.resolve({ event_id: EVENT_ID }) });

    expect(res.status).toBe(401);
  });

  it("returns 401 when HMAC is computed for a different event_id (tampered)", async () => {
    const { POST } = await import("../route");
    // Signature is valid — but for a different event_id than the route param.
    const sigForOtherId = validSignature("evt_some_other_event");
    const req = makeSignedRequest(EVENT_ID, sigForOtherId);

    const res = await POST(req, { params: Promise.resolve({ event_id: EVENT_ID }) });

    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not an admin", async () => {
    const { adminWithPermission } = await import("@/lib/admin-guard");
    vi.mocked(adminWithPermission).mockResolvedValue(
      Response.json({ error: "Forbidden" }, { status: 403 }),
    );

    const { POST } = await import("../route");
    const req = makeSignedRequest(EVENT_ID, validSignature(EVENT_ID));

    const res = await POST(req, { params: Promise.resolve({ event_id: EVENT_ID }) });

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
    const req = makeSignedRequest(EVENT_ID, validSignature(EVENT_ID));

    const res = await POST(req, { params: Promise.resolve({ event_id: EVENT_ID }) });

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
    const req = makeSignedRequest(EVENT_ID, validSignature(EVENT_ID));

    const res = await POST(req, { params: Promise.resolve({ event_id: EVENT_ID }) });

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
        attempt: 0,
      },
    });
  });
});
