import { beforeEach, describe, expect, it, vi } from "vitest";

const { auditedMock, reviewReferenceMock, logAdminActionMock } = vi.hoisted(
  () => ({
    auditedMock: vi.fn(),
    reviewReferenceMock: vi.fn(),
    logAdminActionMock: vi.fn(),
  }),
);

vi.mock("@/lib/audited-admin-action", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/audited-admin-action")
  >("@/lib/audited-admin-action");
  return {
    ...actual,
    auditedAdminActionWithPermission: auditedMock,
  };
});

vi.mock("@/lib/admin-audit", () => ({
  logAdminAction: logAdminActionMock,
}));

vi.mock("@/services/admin/verification-service", () => ({
  reviewReference: reviewReferenceMock,
}));

const ctx = { supabase: {}, user: { id: "admin-1" }, adminRole: "moderation_admin" };

const REF_ID = "11111111-1111-4111-8111-111111111111";

function makeReq(body: unknown) {
  return new Request(
    `http://localhost/api/admin/references/${REF_ID}/review`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

const params = Promise.resolve({ id: REF_ID });

describe("POST /api/admin/references/[id]/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: wrapper runs fn, surfaces AdminActionError with its status, else 200.
    auditedMock.mockImplementation(
      async (
        _req: Request,
        _action: string,
        _targetType: string,
        _targetId: string,
        _permission: string,
        fn: (c: typeof ctx) => Promise<unknown>,
      ) => {
        const { AdminActionError } = await import(
          "@/lib/audited-admin-action"
        );
        try {
          const result = await fn(ctx);
          return Response.json(result);
        } catch (e) {
          if (e instanceof AdminActionError) {
            return Response.json({ error: e.message }, { status: e.status });
          }
          return Response.json({ error: "Action failed" }, { status: 500 });
        }
      },
    );
  });

  it("returns the wrapper's permission failure verbatim (non-admin)", async () => {
    auditedMock.mockResolvedValueOnce(
      Response.json({ error: "Insufficient permissions" }, { status: 403 }),
    );
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "verify" }), { params });
    expect(res.status).toBe(403);
    expect(reviewReferenceMock).not.toHaveBeenCalled();
  });

  it("verify → 200 and logs metadata { decision, reason }", async () => {
    reviewReferenceMock.mockResolvedValue({ success: true });
    const { POST } = await import("./route");
    const res = await POST(
      makeReq({ decision: "verify", reason: "looks good" }),
      { params },
    );
    expect(res.status).toBe(200);
    expect(reviewReferenceMock).toHaveBeenCalledWith(
      ctx.supabase,
      expect.objectContaining({
        referenceId: REF_ID,
        decision: "verify",
        reason: "looks good",
        adminId: "admin-1",
      }),
    );
    expect(logAdminActionMock).toHaveBeenCalledWith(
      ctx.supabase,
      expect.objectContaining({
        action: "reference.review",
        targetType: "provider_reference",
        targetId: REF_ID,
        metadata: { decision: "verify", reason: "looks good" },
      }),
    );
  });

  it("reject without reason → 400", async () => {
    reviewReferenceMock.mockResolvedValue({
      success: false,
      code: "reason_required",
      error: "A reason is required to reject or flag a reference",
    });
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "reject" }), { params });
    expect(res.status).toBe(400);
    expect(logAdminActionMock).not.toHaveBeenCalled();
  });

  it("invalid_state → 409", async () => {
    reviewReferenceMock.mockResolvedValue({
      success: false,
      code: "invalid_state",
      error: "This reference was already reviewed.",
    });
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "verify" }), { params });
    expect(res.status).toBe(409);
  });

  it("not_found → 404", async () => {
    reviewReferenceMock.mockResolvedValue({
      success: false,
      code: "not_found",
      error: "Reference not found",
    });
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "flag", reason: "x" }), {
      params,
    });
    expect(res.status).toBe(404);
  });

  it("invalid body (bad decision) → 400 before wrapper", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "nope" }), { params });
    expect(res.status).toBe(400);
    expect(auditedMock).not.toHaveBeenCalled();
  });

  it("empty-string reason → 400 (reason must be non-empty)", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "flag", reason: "" }), {
      params,
    });
    expect(res.status).toBe(400);
    expect(auditedMock).not.toHaveBeenCalled();
  });

  it("malformed id → 404 before body/wrapper", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeReq({ decision: "verify" }), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(res.status).toBe(404);
    expect(auditedMock).not.toHaveBeenCalled();
    expect(reviewReferenceMock).not.toHaveBeenCalled();
  });
});
