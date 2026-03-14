import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCompare } from "@/components/compare/useCompare";

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => mockStorage[k] ?? null,
  setItem: (k: string, v: string) => {
    mockStorage[k] = v;
  },
});

describe("useCompare", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useCompare());
    expect(result.current.ids).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isFull).toBe(false);
  });

  it("adds a provider", () => {
    const { result } = renderHook(() => useCompare());
    act(() => result.current.add("id-1"));
    expect(result.current.ids).toContain("id-1");
    expect(result.current.count).toBe(1);
  });

  it("ignores add when full (3 items)", () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.add("a");
      result.current.add("b");
      result.current.add("c");
    });
    act(() => result.current.add("d"));
    expect(result.current.count).toBe(3);
    expect(result.current.isFull).toBe(true);
  });

  it("removes a provider", () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.add("x");
      result.current.remove("x");
    });
    expect(result.current.ids).not.toContain("x");
  });

  it("has() returns true for added provider", () => {
    const { result } = renderHook(() => useCompare());
    act(() => result.current.add("y"));
    expect(result.current.has("y")).toBe(true);
    expect(result.current.has("z")).toBe(false);
  });
});
