import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabaseClient } from "../mocks/supabase";

// Mock the browser client
const mockClient = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockClient),
}));

import { useAuth } from "@/hooks/useAuth";

describe("useAuth hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    });
  });

  it("initializes with loading=true", () => {
    // Keep getUser pending
    mockClient.auth.getUser.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("resolves user from getUser on mount", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("sets user to null when getUser returns no user", async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("subscribes to onAuthStateChange for real-time updates", async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  it("unsubscribes on unmount", async () => {
    const unsubscribe = vi.fn();
    mockClient.auth.onAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe } },
    });
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it("updates user when auth state changes", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    let authCallback: (event: string, session: unknown) => void;

    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    mockClient.auth.onAuthStateChange.mockImplementationOnce((callback: (event: string, session: unknown) => void) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();

    // Simulate auth state change
    act(() => {
      authCallback!("SIGNED_IN", { user: mockUser });
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("exposes signIn, signUp, signOut, signInWithOAuth functions", async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
    expect(typeof result.current.signInWithOAuth).toBe("function");
  });
});
