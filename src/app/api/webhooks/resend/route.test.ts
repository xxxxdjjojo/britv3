/**
 * Tests for the Resend delivery webhook route (TDD RED — route not yet implemented)
 *
 * Pins the contract of POST @/app/api/webhooks/resend/route:
 *  1. Signature verification via a LOCAL verifier module
 *     @/lib/email/resend-webhook-verifier exporting
 *       verifyResendWebhook(payload: string, headers, secret): boolean
 *     ('svix' is NOT in package.json — the implementation hand-rolls HMAC
 *     per the svix spec behind this module; this test mocks the module).
 *     Headers: svix-id / svix-timestamp / svix-signature.
 *     Secret: process.env.RESEND_WEBHOOK_SECRET.
 *  2. Invalid signature → 400, no DB access at all.
 *  3. Valid 'email.delivered' → email_logs status 'delivered' matched on
 *     resend_id (data.email_id) + truedeed_audit_log insert → 200.
 *  4. Valid 'email.bounced' → status 'bounced' + audit row → 200.
 *  5. Idempotency: a second call with the same svix-id → 200 with NO new
 *     writes (dedupe via truedeed_audit_log existence keyed on the svix-id;
 *     the audit row payload must therefore contain the svix-id).
 *
 * All test data is synthetic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/email/resend-webhook-verifier", () => ({
  verifyResendWebhook: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { verifyResendWebhook } from "@/lib/email/resend-webhook-verifier";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/webhooks/resend/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "whsec_test_synthetic";
const RESEND_EMAIL_ID = "re_synthetic_123abc";

function makeEvent(type: "email.delivered" | "email.bounced") {
  return {
    type,
    created_at: "2026-06-12T10:00:00.000Z",
    data: {
      email_id: RESEND_EMAIL_ID,
      to: ["agent@example.com"],
      from: "truedeed@example.com",
      subject: "Introduction recorded",
    },
  };
}

function makeRequest(
  body: unknown,
  svixId = "msg_synthetic_001",
): Request {
  return new Request("http://localhost/api/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": svixId,
      "svix-timestamp": "1781258400",
      "svix-signature": "v1,c3ludGhldGljLXNpZ25hdHVyZQ==",
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// DB mock — explicit chains (pattern from webhooks/stripe/route.test.ts)
// ---------------------------------------------------------------------------

function createDb() {
  // email_logs: update(...).eq("resend_id", id)
  const emailLogsEq = vi.fn().mockResolvedValue({ data: null, error: null });
  const emailLogsUpdate = vi.fn(() => ({ eq: emailLogsEq }));

  // truedeed_audit_log: insert(...) + dedupe lookup select(...).eq(...).maybeSingle()
  const auditInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const auditMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: null, error: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditFilter: any = {};
  auditFilter.eq = vi.fn(() => auditFilter);
  auditFilter.maybeSingle = auditMaybeSingle;
  const auditSelect = vi.fn(() => auditFilter);

  const from = vi.fn((table: string) => {
    if (table === "email_logs") {
      return { update: emailLogsUpdate };
    }
    if (table === "truedeed_audit_log") {
      return { insert: auditInsert, select: auditSelect };
    }
    return {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return {
    supabase: { from },
    from,
    emailLogsUpdate,
    emailLogsEq,
    auditInsert,
    auditMaybeSingle,
  };
}

let db: ReturnType<typeof createDb>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_WEBHOOK_SECRET", WEBHOOK_SECRET);
  db = createDb();
  vi.mocked(createAdminClient).mockReturnValue(db.supabase as never);
  vi.mocked(verifyResendWebhook).mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// 1. Signature verification
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/resend — signature verification", () => {
  it("verifies the raw payload against the svix headers and RESEND_WEBHOOK_SECRET", async () => {
    await POST(makeRequest(makeEvent("email.delivered")));

    expect(verifyResendWebhook).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        "svix-id": "msg_synthetic_001",
        "svix-timestamp": "1781258400",
        "svix-signature": "v1,c3ludGhldGljLXNpZ25hdHVyZQ==",
      }),
      WEBHOOK_SECRET,
    );
  });

  it("returns 400 and performs no DB access when the signature is invalid", async () => {
    vi.mocked(verifyResendWebhook).mockReturnValue(false);

    const response = await POST(makeRequest(makeEvent("email.delivered")));

    expect(response.status).toBe(400);
    expect(db.from).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. Delivered / bounced events
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/resend — event handling", () => {
  it("email.delivered → email_logs status 'delivered' matched on resend_id + audit row → 200", async () => {
    const response = await POST(makeRequest(makeEvent("email.delivered")));

    expect(response.status).toBe(200);
    expect(db.emailLogsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "delivered" }),
    );
    expect(db.emailLogsEq).toHaveBeenCalledWith("resend_id", RESEND_EMAIL_ID);
    expect(db.auditInsert).toHaveBeenCalledTimes(1);
  });

  it("email.bounced → email_logs status 'bounced' matched on resend_id + audit row → 200", async () => {
    const response = await POST(makeRequest(makeEvent("email.bounced")));

    expect(response.status).toBe(200);
    expect(db.emailLogsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "bounced" }),
    );
    expect(db.emailLogsEq).toHaveBeenCalledWith("resend_id", RESEND_EMAIL_ID);
    expect(db.auditInsert).toHaveBeenCalledTimes(1);
  });

  it("the audit row contains the svix-id (the idempotency key)", async () => {
    await POST(makeRequest(makeEvent("email.delivered"), "msg_keyed_42"));

    expect(db.auditInsert).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(db.auditInsert.mock.calls[0][0])).toContain(
      "msg_keyed_42",
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Idempotency
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/resend — idempotency", () => {
  it("a duplicate svix-id returns 200 without a second email_logs write or audit insert", async () => {
    const svixId = "msg_dup_001";

    // First delivery: no existing audit row for this svix-id
    db.auditMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const first = await POST(makeRequest(makeEvent("email.delivered"), svixId));
    expect(first.status).toBe(200);
    expect(db.emailLogsUpdate).toHaveBeenCalledTimes(1);
    expect(db.auditInsert).toHaveBeenCalledTimes(1);

    // Redelivery: the audit row now exists for this svix-id
    db.auditMaybeSingle.mockResolvedValue({
      data: { id: "audit-existing-1" },
      error: null,
    });
    const second = await POST(
      makeRequest(makeEvent("email.delivered"), svixId),
    );

    expect(second.status).toBe(200);
    // No new writes on the duplicate
    expect(db.emailLogsUpdate).toHaveBeenCalledTimes(1);
    expect(db.auditInsert).toHaveBeenCalledTimes(1);
  });
});
