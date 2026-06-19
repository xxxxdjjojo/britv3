import { beforeEach, describe, expect, it, vi } from "vitest";
import { inviteTeamMember } from "@/services/agent/agent-team-service";

const { resendSendMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
    emails: {
      send: resendSendMock,
    },
    };
  }),
}));

function createSupabaseMock() {
  const inserted = {
    id: "member-1",
    agent_id: "agent-1",
    user_id: "user-1",
    email: "agent@example.com",
    name: "Alex Agent",
    role: "admin",
    branch_id: null,
    status: "pending",
    invited_at: new Date().toISOString(),
  };

  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
  };

  return {
    from: vi.fn().mockReturnValue(chain),
  };
}

describe("agent-team-service invite emails", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-resend-key";
    resendSendMock.mockReset();
    resendSendMock.mockResolvedValue({ id: "email-1" });
  });

  it("uses TrueDeed sender, subject and body copy", async () => {
    const supabase = createSupabaseMock();

    await inviteTeamMember(supabase as never, "agent-1", {
      user_id: "user-1",
      email: "agent@example.com",
      name: "Alex Agent",
      role: "admin",
    });

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "TrueDeed <hello@truedeed.co.uk>",
        to: "agent@example.com",
        subject: "You have been invited to join a team on TrueDeed",
        html: expect.stringContaining("TrueDeed"),
      }),
    );
    const payload = resendSendMock.mock.calls[0][0] as { from: string; subject: string; html: string };
    expect(`${payload.from} ${payload.subject} ${payload.html}`).not.toMatch(/Britestate|britestate\./);
  });
});
