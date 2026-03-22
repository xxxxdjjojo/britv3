import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardingStep } from "../useOnboardingStep";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("useOnboardingStep", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useOnboardingStep(1));
    expect(result.current.state).toBe("idle");
    expect(result.current.saving).toBe(false);
  });

  it("transitions to saved on successful save", async () => {
    const { result } = renderHook(() => useOnboardingStep(1));

    await act(async () => {
      await result.current.saveStep(async () => "success");
    });

    expect(result.current.state).toBe("saved");
  });

  it("transitions to error on failed save", async () => {
    const { result } = renderHook(() => useOnboardingStep(1));

    await act(async () => {
      await result.current.saveStep(async () => {
        throw new Error("DB error");
      });
    });

    expect(result.current.state).toBe("error");
    expect(result.current.error).toBe("DB error");
  });

  it("resets state", async () => {
    const { result } = renderHook(() => useOnboardingStep(1));

    await act(async () => {
      await result.current.saveStep(async () => {
        throw new Error("fail");
      });
    });
    expect(result.current.state).toBe("error");

    act(() => result.current.reset());
    expect(result.current.state).toBe("idle");
  });
});
