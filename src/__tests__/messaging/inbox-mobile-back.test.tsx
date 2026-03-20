import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InboxPageClient from "@/app/(protected)/inbox/InboxPageClient";

// Mock child components to isolate the layout behavior
vi.mock("@/components/messaging/InboxList", () => ({
  default: (props: { onSelectConversation: (id: string, recipientId: string) => void }) => (
    <div data-testid="inbox-list">
      <button
        data-testid="select-conversation"
        onClick={() => props.onSelectConversation("conv-1", "user-2")}
      >
        Select Conversation
      </button>
    </div>
  ),
}));

vi.mock("@/components/messaging/MessageThread", () => ({
  default: () => <div data-testid="message-thread">Thread Content</div>,
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
    }),
  }),
}));

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <InboxPageClient />
    </QueryClientProvider>,
  );
}

describe("InboxPageClient mobile back navigation", () => {
  it("renders a back button when a conversation is selected", () => {
    renderWithProviders();

    // Select a conversation
    fireEvent.click(screen.getByTestId("select-conversation"));

    // Thread should be visible
    expect(screen.getByTestId("message-thread")).toBeTruthy();

    // A back button should exist for mobile users to return to inbox list
    const backButton = screen.getByRole("button", { name: /back to inbox/i });
    expect(backButton).toBeTruthy();
  });

  it("clicking back button returns to conversation list", () => {
    renderWithProviders();

    // Select a conversation
    fireEvent.click(screen.getByTestId("select-conversation"));

    // Click back
    const backButton = screen.getByRole("button", { name: /back to inbox/i });
    fireEvent.click(backButton);

    // Thread should be gone, inbox list placeholder should show
    expect(screen.queryByTestId("message-thread")).toBeNull();
    expect(screen.getByText("Select a conversation to start messaging")).toBeTruthy();
  });
});
