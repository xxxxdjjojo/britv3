/**
 * Contract tests for POST /api/landlord/applications/[id]/decision.
 * Accept/reject must run SERVER-SIDE (so the Resend email actually sends —
 * the original client-side call could never read RESEND_API_KEY).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/landlord/tenant-application-service", () => ({
  acceptApplication: vi.fn(),
  rejectApplication: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  acceptApplication,
  rejectApplication,
} from "@/services/landlord/tenant-application-service";
import { POST } from "@/app/api/landlord/applications/[id]/decision/route";

const mockCreateClient = vi.mocked(createClient);
const mockAccept = vi.mocked(acceptApplication);
const mockReject = vi.mocked(rejectApplication);

function authedClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: userId ? null : new Error("no session"),
      }),
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/landlord/applications/app-1/decision", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const ctx = { params: Promise.resolve({ id: "app-1" }) };

describe("POST /api/landlord/applications/[id]/decision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(authedClient("landlord-1"));
    mockAccept.mockResolvedValue(undefined);
    mockReject.mockResolvedValue(undefined);
  });

  it("accepts an application and returns 200 with approved status", async () => {
    const res = await POST(postRequest({ action: "accept" }), ctx);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("approved");
    expect(mockAccept).toHaveBeenCalledWith(expect.anything(), "app-1");
  });

  it("rejects an application with a reason and returns 200 with rejected status", async () => {
    const res = await POST(
      postRequest({ action: "reject", reason: "Failed referencing checks" }),
      ctx,
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("rejected");
    expect(mockReject).toHaveBeenCalledWith(
      expect.anything(),
      "app-1",
      "Failed referencing checks",
    );
  });

  it("returns 400 when rejecting without a sufficient reason", async () => {
    const res = await POST(postRequest({ action: "reject", reason: "no" }), ctx);
    expect(res.status).toBe(400);
    expect(mockReject).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown action", async () => {
    const res = await POST(postRequest({ action: "maybe" }), ctx);
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(authedClient(null));
    const res = await POST(postRequest({ action: "accept" }), ctx);
    expect(res.status).toBe(401);
    expect(mockAccept).not.toHaveBeenCalled();
  });

  it("surfaces a 400 with the message when the service throws (e.g. terminal state)", async () => {
    mockAccept.mockRejectedValue(new Error("Invalid status transition: approved -> approved"));
    const res = await POST(postRequest({ action: "accept" }), ctx);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/invalid status transition/i);
  });
});
