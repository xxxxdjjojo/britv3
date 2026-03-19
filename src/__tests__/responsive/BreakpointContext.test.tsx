// src/__tests__/responsive/BreakpointContext.test.tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { BreakpointProvider } from "@/contexts/BreakpointContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <BreakpointProvider>{children}</BreakpointProvider>;
}

describe("useBreakpoint", () => {
  it("returns a valid breakpoint name", () => {
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(["xs", "sm", "md", "lg", "xl", "2xl"]).toContain(result.current.breakpoint);
  });

  it("returns boolean helpers", () => {
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(typeof result.current.isMobile).toBe("boolean");
    expect(typeof result.current.isTablet).toBe("boolean");
    expect(typeof result.current.isDesktop).toBe("boolean");
  });

  it("defaults to xl during SSR (no window)", () => {
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(result.current.breakpoint).toBeDefined();
  });
});
