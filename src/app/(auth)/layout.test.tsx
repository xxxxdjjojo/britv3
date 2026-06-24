import { describe, expect, it, vi } from "vitest";
import AuthLayout from "./layout";

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("AuthLayout", () => {
  it("does not redirect authenticated users at the shared layout level", async () => {
    createClientMock.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });

    const result = await AuthLayout({ children: <div>Auth child</div> });

    expect(result).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
