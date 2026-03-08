import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMortgageParams } from "./useMortgageParams";

const STORAGE_KEY = "britestate_mortgage_params";

describe("useMortgageParams", () => {
  const mockStorage = new Map<string, string>();

  beforeEach(() => {
    mockStorage.clear();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        mockStorage.delete(key);
      }),
    });
  });

  it("returns null when no stored params", () => {
    const { result } = renderHook(() => useMortgageParams());
    expect(result.current.params).toBeNull();
    expect(result.current.hasParams).toBe(false);
  });

  it("returns parsed params when stored", () => {
    const stored = { deposit: 50000, interestRate: 4.5, termYears: 25 };
    mockStorage.set(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useMortgageParams());
    expect(result.current.params).toEqual(stored);
    expect(result.current.hasParams).toBe(true);
  });

  it("saveParams writes to localStorage", () => {
    const { result } = renderHook(() => useMortgageParams());
    const newParams = { deposit: 40000, interestRate: 3.5, termYears: 30 };

    act(() => {
      result.current.saveParams(newParams);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(newParams),
    );
    expect(result.current.params).toEqual(newParams);
    expect(result.current.hasParams).toBe(true);
  });

  it("clearParams removes from localStorage", () => {
    const stored = { deposit: 50000, interestRate: 4.5, termYears: 25 };
    mockStorage.set(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useMortgageParams());

    act(() => {
      result.current.clearParams();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(result.current.params).toBeNull();
    expect(result.current.hasParams).toBe(false);
  });

  it("handles JSON parse errors gracefully", () => {
    mockStorage.set(STORAGE_KEY, "not-valid-json");

    const { result } = renderHook(() => useMortgageParams());
    expect(result.current.params).toBeNull();
    expect(result.current.hasParams).toBe(false);
  });
});
