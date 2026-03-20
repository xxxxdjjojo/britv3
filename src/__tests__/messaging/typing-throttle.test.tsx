import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MessageComposer from "@/components/messaging/MessageComposer";

// Track broadcast calls
const broadcastSendFn = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      send: broadcastSendFn,
    }),
  }),
}));

vi.mock("@/hooks/useMessages", () => ({
  useSendMessage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/services/smart-replies/smart-replies", () => ({
  getSuggestedReplies: () => [],
}));

function renderComposer() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MessageComposer
        conversationId="conv-1"
        recipientId="user-2"
        currentUserId="user-1"
      />
    </QueryClientProvider>,
  );
}

describe("MessageComposer typing broadcast throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    broadcastSendFn.mockClear();
  });

  it("does not fire a broadcast on every single keystroke", () => {
    renderComposer();

    const textarea = screen.getByPlaceholderText(/type a message/i);

    // Type 10 characters rapidly
    for (let i = 0; i < 10; i++) {
      fireEvent.change(textarea, { target: { value: "a".repeat(i + 1) } });
    }

    // With throttle, should be significantly fewer than 10 broadcasts
    // At most 1 immediate + 0 throttled (within same tick) = 1-2 calls
    expect(broadcastSendFn.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("sends typing broadcast after throttle period elapses", () => {
    renderComposer();

    const textarea = screen.getByPlaceholderText(/type a message/i);

    // Type one character
    fireEvent.change(textarea, { target: { value: "a" } });
    const initialCalls = broadcastSendFn.mock.calls.length;

    // Advance past throttle period
    vi.advanceTimersByTime(1100);

    // Type another character
    fireEvent.change(textarea, { target: { value: "ab" } });

    // Should allow another broadcast after throttle period
    expect(broadcastSendFn.mock.calls.length).toBeGreaterThan(initialCalls);
  });
});
