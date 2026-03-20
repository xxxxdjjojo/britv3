import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MessageThread from "@/components/messaging/MessageThread";

vi.mock("@/hooks/useMessages", () => ({
  useMessages: () => ({
    data: { pages: [{ messages: [] }], pageParams: [] },
    isLoading: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  }),
  useMarkAsRead: vi.fn(),
  useSendMessage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
      send: vi.fn(),
    }),
    removeChannel: vi.fn(),
  }),
}));

vi.mock("@/services/smart-replies/smart-replies", () => ({
  getSuggestedReplies: () => [],
}));

function renderThread() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MessageThread conversationId="conv-1" recipientId="user-2" />
    </QueryClientProvider>,
  );
}

describe("MessageThread does not render stub QuickActionsBar", () => {
  it("should not render non-functional quick action buttons", () => {
    renderThread();

    // These were the stub quick action labels rendered without onClick handlers
    const scheduleViewing = screen.queryByRole("button", { name: /schedule viewing/i });
    const sendDocument = screen.queryByRole("button", { name: /send document/i });
    const shareLocation = screen.queryByRole("button", { name: /share location/i });
    const requestQuote = screen.queryByRole("button", { name: /request quote/i });

    expect(scheduleViewing).toBeNull();
    expect(sendDocument).toBeNull();
    expect(shareLocation).toBeNull();
    expect(requestQuote).toBeNull();
  });
});
