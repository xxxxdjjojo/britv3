import { describe, it, expect, vi, beforeEach } from "vitest";

const auditMocks = vi.hoisted(() => ({ auditedAdminActionWithPermission: vi.fn() }));
const serviceMocks = vi.hoisted(() => ({ generateTriagePacket: vi.fn() }));

vi.mock("@/lib/audited-admin-action", () => ({
  auditedAdminActionWithPermission: auditMocks.auditedAdminActionWithPermission,
}));
vi.mock("@/services/support/triage-packet-service", () => ({
  generateTriagePacket: serviceMocks.generateTriagePacket,
}));

import { POST } from "./route";

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/support/[id]/triage-packet", () => {
  it("delegates to the audited wrapper with the ticket permission and returns markdown", async () => {
    auditMocks.auditedAdminActionWithPermission.mockImplementation(
      async (_req, _action, _tt, _tid, _perm, fn) =>
        Response.json(await fn({ supabase: {}, user: { id: "admin-1" } })),
    );
    serviceMocks.generateTriagePacket.mockResolvedValue({
      markdown: "# Triage packet — TD-1",
      correlationId: null,
      userId: null,
    });

    const req = new Request("http://localhost/api/admin/support/t1/triage-packet", { method: "POST" });
    const res = await POST(req, params("t1"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.markdown).toContain("TD-1");

    const [, action, targetType, targetId, permission] =
      auditMocks.auditedAdminActionWithPermission.mock.calls[0];
    expect(action).toBe("support_ticket.triage_packet");
    expect(targetType).toBe("support_ticket");
    expect(targetId).toBe("t1");
    expect(permission).toBe("manage_support_tickets");
    expect(serviceMocks.generateTriagePacket).toHaveBeenCalledWith({}, "t1");
  });
});
