import { beforeEach, describe, expect, it, vi } from "vitest";

const { auditedMock, createAdminClientMock, inviteUserByEmailMock, updateMock } =
  vi.hoisted(() => ({
    auditedMock: vi.fn(),
    createAdminClientMock: vi.fn(),
    inviteUserByEmailMock: vi.fn(),
    updateMock: vi.fn(),
  }));

vi.mock("@/lib/audited-admin-action", () => ({
  auditedAdminActionWithPermission: auditedMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

describe("POST /api/admin/team/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditedMock.mockImplementation(
      async (
        _req: Request,
        _action: string,
        _targetType: string,
        _targetId: string,
        _permission: string,
        fn: () => Promise<unknown>,
      ) => Response.json(await fn()),
    );

    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    createAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          inviteUserByEmail: inviteUserByEmailMock,
        },
      },
      from: vi.fn(() => ({
        update: updateMock,
      })),
    });
  });

  it("invites and promotes the returned user with an explicit admin role", async () => {
    inviteUserByEmailMock.mockResolvedValue({
      data: { user: { id: "invited-admin-1", email: "ops@example.com" } },
      error: null,
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/team/invite", {
        method: "POST",
        body: JSON.stringify({ email: "ops@example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(inviteUserByEmailMock).toHaveBeenCalledWith("ops@example.com", {
      data: { role: "admin", admin_role: "moderation_admin" },
    });
    expect(updateMock).toHaveBeenCalledWith({
      is_admin: true,
      admin_role: "moderation_admin",
    });
  });
});
