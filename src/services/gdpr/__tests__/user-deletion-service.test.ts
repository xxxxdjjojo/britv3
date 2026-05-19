import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks so the dynamic import inside each test resolves to the same
// instances we set up here.
const { inngestSendMock, captureExceptionMock } = vi.hoisted(() => ({
  inngestSendMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock("../../../inngest/client", () => ({
  inngest: {
    send: inngestSendMock,
  },
}));

vi.mock("../../../lib/observability/capture-exception", () => ({
  captureException: captureExceptionMock,
  getErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : String(err),
}));

function makeSupabase(rpcResult: {
  data?: { status: string } | null;
  error?: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: rpcResult.data ?? null,
    error: rpcResult.error ?? null,
  });
  const rpc = vi.fn().mockReturnValue({ maybeSingle });

  return {
    supabase: { rpc } as never,
    rpc,
    maybeSingle,
  };
}

describe("requestUserDeletion", () => {
  beforeEach(() => {
    vi.resetModules();
    inngestSendMock.mockReset();
    inngestSendMock.mockResolvedValue({ ids: ["evt-1"] });
    captureExceptionMock.mockReset();
  });

  it("calls request_user_deletion RPC, emits Inngest event, returns pending", async () => {
    // Arrange
    const { supabase, rpc } = makeSupabase({
      data: { status: "pending" },
      error: null,
    });

    // Act
    const { requestUserDeletion } = await import("../user-deletion-service");
    const result = await requestUserDeletion(supabase, "user-1", {
      reason: "user_request",
      adminUserId: null,
    });

    // Assert
    expect(rpc).toHaveBeenCalledWith("request_user_deletion", {
      p_user_id: "user-1",
      p_reason: "user_request",
      p_admin_user_id: null,
    });
    expect(inngestSendMock).toHaveBeenCalledWith({
      name: "gdpr/user.deletion-requested",
      data: {
        userId: "user-1",
        requestedBy: null,
        reason: "user_request",
      },
    });
    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "pending" });
  });

  it("does not emit Inngest event when user is already completed", async () => {
    // Arrange
    const { supabase } = makeSupabase({
      data: { status: "completed" },
      error: null,
    });

    // Act
    const { requestUserDeletion } = await import("../user-deletion-service");
    const result = await requestUserDeletion(supabase, "user-2");

    // Assert
    expect(inngestSendMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "already_completed" });
  });

  it("captures exception and returns failed when RPC errors", async () => {
    // Arrange
    const { supabase } = makeSupabase({
      data: null,
      error: { message: "boom" },
    });

    // Act
    const { requestUserDeletion } = await import("../user-deletion-service");
    const result = await requestUserDeletion(supabase, "user-3", {
      reason: "admin",
      adminUserId: "admin-1",
    });

    // Assert
    expect(inngestSendMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        module: "gdpr",
        feature: "user-deletion-request",
        operation: "request-user-deletion",
        extra: expect.objectContaining({
          userId: "user-3",
          reason: "admin",
          adminUserId: "admin-1",
        }),
      }),
    );
    expect(result.status).toBe("failed");
    expect(result.error).toContain("boom");
  });
});
