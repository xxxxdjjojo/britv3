import { describe, it, expect, vi, beforeEach } from "vitest";

const guardMocks = vi.hoisted(() => ({ adminWithPermission: vi.fn() }));
const auditMocks = vi.hoisted(() => ({ auditedAdminActionWithPermission: vi.fn() }));
const registryMocks = vi.hoisted(() => ({ getTier1Action: vi.fn() }));
const adminClientMocks = vi.hoisted(() => ({ insert: vi.fn(async (_row: unknown) => ({ error: null })) }));

vi.mock("@/lib/admin-guard", () => ({ adminWithPermission: guardMocks.adminWithPermission }));
vi.mock("@/lib/audited-admin-action", async () => {
  const actual = await vi.importActual<typeof import("@/lib/audited-admin-action")>(
    "@/lib/audited-admin-action",
  );
  return {
    ...actual,
    auditedAdminActionWithPermission: auditMocks.auditedAdminActionWithPermission,
  };
});
vi.mock("@/services/admin/tier1-actions/registry", () => ({
  getTier1Action: registryMocks.getTier1Action,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert: adminClientMocks.insert }) }),
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({}) }));

import { POST } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/admin/tier1-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const fakeAction = {
  key: "resend-verification-email",
  label: "Resend verification email",
  requiredPermission: "manage_users" as const,
  targetType: "user" as const,
  risk: "low" as const,
  reversible: true,
  preview: vi.fn(async () => ({ summary: "s", effects: [], reversible: true, requiresApproval: false })),
  execute: vi.fn(async () => ({ summary: "done" })),
};

beforeEach(() => {
  vi.clearAllMocks();
  registryMocks.getTier1Action.mockReturnValue(fakeAction);
});

describe("POST /api/admin/tier1-actions", () => {
  it("rejects an invalid body", async () => {
    const res = await POST(req({ mode: "preview" }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown action", async () => {
    registryMocks.getTier1Action.mockReturnValue(undefined);
    const res = await POST(req({ actionKey: "nope", targetId: "u1", mode: "preview" }));
    expect(res.status).toBe(400);
  });

  it("preview passes through the permission gate (403)", async () => {
    guardMocks.adminWithPermission.mockResolvedValue(
      Response.json({ error: "Insufficient permissions" }, { status: 403 }),
    );
    const res = await POST(req({ actionKey: fakeAction.key, targetId: "u1", mode: "preview" }));
    expect(res.status).toBe(403);
    expect(fakeAction.preview).not.toHaveBeenCalled();
  });

  it("preview returns the dry-run result on success", async () => {
    guardMocks.adminWithPermission.mockResolvedValue({ user: { id: "admin-1" } });
    const res = await POST(req({ actionKey: fakeAction.key, targetId: "u1", mode: "preview" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.preview.summary).toBe("s");
    expect(fakeAction.preview).toHaveBeenCalledOnce();
  });

  it("execute delegates to the audited wrapper with the action's permission", async () => {
    auditMocks.auditedAdminActionWithPermission.mockImplementation(
      async (_req, _action, _tt, _tid, _perm, fn) =>
        Response.json(await fn({ user: { id: "admin-1" } })),
    );
    const res = await POST(
      req({ actionKey: fakeAction.key, targetId: "u1", mode: "execute", ticketId: "11111111-1111-1111-1111-111111111111" }),
    );
    expect(res.status).toBe(200);
    const [, actionName, targetType, targetId, permission] =
      auditMocks.auditedAdminActionWithPermission.mock.calls[0];
    expect(actionName).toBe("tier1.resend-verification-email");
    expect(targetType).toBe("user");
    expect(targetId).toBe("u1");
    expect(permission).toBe("manage_users");
    expect(fakeAction.execute).toHaveBeenCalledOnce();
    // ticket system note appended
    expect(adminClientMocks.insert).toHaveBeenCalledOnce();
    expect(adminClientMocks.insert.mock.calls[0][0]).toMatchObject({
      author_type: "system",
      internal_note: true,
    });
  });
});
