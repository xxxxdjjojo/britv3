import { beforeEach, describe, expect, it, vi } from "vitest";

const { auditedMock, logAdminActionMock, updatedRow } = vi.hoisted(() => ({
  auditedMock: vi.fn(),
  logAdminActionMock: vi.fn(),
  updatedRow: {
    id: true,
    required_peer_vouches: 5,
    required_client_vouches: 3,
    client_recency_days: 90,
    invite_expiry_days: 30,
    resend_cooldown_hours: 24,
    gate_enabled: true,
    updated_at: "2026-07-12T00:00:00Z",
    updated_by: "admin-1",
  },
}));

vi.mock("@/lib/audited-admin-action", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/audited-admin-action")
  >("@/lib/audited-admin-action");
  return { ...actual, auditedAdminActionWithPermission: auditedMock };
});

vi.mock("@/lib/admin-audit", () => ({ logAdminAction: logAdminActionMock }));

// Supabase chain: from().update().eq().select().maybeSingle()
function makeSupabase() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { supabase: { from }, update };
}

function makeReq(body: unknown) {
  return new Request("http://localhost/api/admin/vouch-rules", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

describe("PUT /api/admin/vouch-rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valid update → 200 with updated rules and audit metadata", async () => {
    const { supabase, update } = makeSupabase();
    const ctx = { supabase, user: { id: "admin-1" }, adminRole: "moderation_admin" };
    auditedMock.mockImplementation(
      async (
        _req: Request,
        _a: string,
        _t: string,
        _id: string,
        _p: string,
        fn: (c: typeof ctx) => Promise<unknown>,
      ) => Response.json(await fn(ctx)),
    );

    const { PUT } = await import("./route");
    const res = await PUT(
      makeReq({ required_peer_vouches: 5, gate_enabled: true }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { rules: { required_peer_vouches: number } };
    expect(json.rules.required_peer_vouches).toBe(5);
    expect(update).toHaveBeenCalledWith({
      required_peer_vouches: 5,
      gate_enabled: true,
      updated_by: "admin-1",
    });
    expect(logAdminActionMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        action: "vouch_rules.update",
        targetType: "verification_vouch_rules",
        targetId: "singleton",
        metadata: { changed: { required_peer_vouches: 5, gate_enabled: true } },
      }),
    );
  });

  it("invalid body (negative int) → 400", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeReq({ required_peer_vouches: -1 }));
    expect(res.status).toBe(400);
    expect(auditedMock).not.toHaveBeenCalled();
  });

  it("empty body → 400 (no fields to update)", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeReq({}));
    expect(res.status).toBe(400);
    expect(auditedMock).not.toHaveBeenCalled();
  });

  it("zero recency days rejected → 400", async () => {
    const { PUT } = await import("./route");
    const res = await PUT(makeReq({ client_recency_days: 0 }));
    expect(res.status).toBe(400);
  });
});
