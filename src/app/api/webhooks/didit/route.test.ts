import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "whsec_test";

const envMock: { DIDIT_WEBHOOK_SECRET: string } = { DIDIT_WEBHOOK_SECRET: "whsec_test" };
vi.mock("@/env", () => ({
  get env() {
    return envMock;
  },
}));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { POST } from "./route";

function makeUpdateResult(matchedRows: number) {
  // update().eq("kyc_provider_ref",..).eq("id",..).select("id") resolves with data rows
  const second = vi.fn().mockReturnValue({
    select: vi.fn().mockResolvedValue({
      data: Array.from({ length: matchedRows }, (_, i) => ({ id: `row-${i}` })),
      error: null,
    }),
  });
  const first = vi.fn().mockReturnValue({ eq: second });
  return { update: vi.fn().mockReturnValue({ eq: first }) };
}

function signedRequest(payload: object, overrides?: { signature?: string; timestamp?: string }) {
  const raw = JSON.stringify(payload);
  const timestamp = overrides?.timestamp ?? String(Math.floor(Date.now() / 1000));
  const signature = overrides?.signature ?? createHmac("sha256", SECRET).update(raw).digest("hex");
  return new Request("http://localhost/api/webhooks/didit", {
    method: "POST",
    body: raw,
    headers: { "x-signature": signature, "x-timestamp": timestamp },
  });
}

describe("POST /api/webhooks/didit", () => {
  beforeEach(() => {
    fromMock.mockReset();
    envMock.DIDIT_WEBHOOK_SECRET = "whsec_test";
  });

  it("500s (loud) when the webhook secret is unset, without touching the database", async () => {
    envMock.DIDIT_WEBHOOK_SECRET = "";
    const res = await POST(signedRequest({ session_id: "s1", status: "Approved", vendor_data: "user-1" }));
    expect(res.status).toBe(500);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("401s on a bad signature without touching the database", async () => {
    const res = await POST(signedRequest({ session_id: "s1", status: "Approved" }, { signature: "bad" }));
    expect(res.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("writes verified for an Approved session matched by vendor_data + session id", async () => {
    fromMock.mockReturnValue(makeUpdateResult(1));
    const res = await POST(signedRequest({ session_id: "s1", status: "Approved", vendor_data: "user-1" }));
    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith("profiles");
    const updateArg = fromMock.mock.results[0].value.update.mock.calls[0][0];
    expect(updateArg).toEqual({ kyc_status: "verified" });
  });

  it("writes failed for a Declined session", async () => {
    fromMock.mockReturnValue(makeUpdateResult(1));
    const res = await POST(signedRequest({ session_id: "s1", status: "Declined", vendor_data: "user-1" }));
    expect(res.status).toBe(200);
    const updateArg = fromMock.mock.results[0].value.update.mock.calls[0][0];
    expect(updateArg).toEqual({ kyc_status: "failed" });
  });

  it("acks (200, no write) when the status is unknown", async () => {
    const res = await POST(signedRequest({ session_id: "s1", status: "SomethingNew", vendor_data: "user-1" }));
    expect(res.status).toBe(200);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("acks (200) when no profile matches the session", async () => {
    fromMock.mockReturnValue(makeUpdateResult(0));
    const res = await POST(signedRequest({ session_id: "stale", status: "Approved", vendor_data: "user-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(false);
  });

  it("500s when the database write fails (so Didit redelivers)", async () => {
    const second = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    });
    const first = vi.fn().mockReturnValue({ eq: second });
    fromMock.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: first }) });
    const res = await POST(signedRequest({ session_id: "s1", status: "Approved", vendor_data: "user-1" }));
    expect(res.status).toBe(500);
  });

  it("400s when the payload has no session_id", async () => {
    const res = await POST(signedRequest({ status: "Approved" }));
    expect(res.status).toBe(400);
  });
});
