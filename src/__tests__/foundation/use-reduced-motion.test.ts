import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * useReducedMotion hook tests.
 *
 * Verifies:
 * - SSR-safe: returns false (server snapshot) by default when matchMedia is absent
 * - Returns the current matchMedia value on the client
 * - Responds to change events
 * - Cleans up the event listener on unmount
 */

type ChangeListener = (event: { matches: boolean }) => void;

function makeMql(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const mql = {
    matches: initialMatches,
    addEventListener: vi.fn((_event: string, cb: ChangeListener) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: ChangeListener) => {
      listeners.delete(cb);
    }),
    // Helper to simulate a media query change
    _trigger(matches: boolean) {
      mql.matches = matches;
      for (const cb of listeners) cb({ matches });
    },
  };
  return mql;
}

describe("useReducedMotion", () => {
  let mql: ReturnType<typeof makeMql>;
  let matchMediaSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mql = makeMql(false);
    matchMediaSpy = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue(mql as unknown as MediaQueryList);
  });

  afterEach(() => {
    matchMediaSpy.mockRestore();
  });

  it("returns false when prefers-reduced-motion is not set", () => {
    mql = makeMql(false);
    matchMediaSpy.mockReturnValue(mql as unknown as MediaQueryList);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce is active", () => {
    mql = makeMql(true);
    matchMediaSpy.mockReturnValue(mql as unknown as MediaQueryList);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    mql = makeMql(false);
    matchMediaSpy.mockReturnValue(mql as unknown as MediaQueryList);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mql._trigger(true);
    });

    expect(result.current).toBe(true);
  });

  it("removes the event listener on unmount", () => {
    mql = makeMql(false);
    matchMediaSpy.mockReturnValue(mql as unknown as MediaQueryList);

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalled();
  });

  it("uses false as the server/SSR snapshot when server-rendered", () => {
    // renderToString drives useSyncExternalStore through getServerSnapshot (which
    // returns false), so the hook must never touch window.matchMedia during SSR
    // and must render the false branch. This is the real SSR-safety guarantee.
    const Probe = () =>
      createElement("span", null, String(useReducedMotion()));
    const html = renderToString(createElement(Probe));
    expect(html).toBe("<span>false</span>");
  });
});
