import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Conversation } from "@/types/messaging";

// Stub MessageThread so we can assert the props the shell passes to it
// (participantName + recipientId) without booting the real chat thread.
vi.mock("./MessageThread", () => ({
  default: ({
    participantName,
    recipientId,
  }: {
    participantName?: string;
    recipientId?: string;
  }) => (
    <div data-testid="thread">
      <span data-testid="thread-name">{participantName ?? "(none)"}</span>
      <span data-testid="thread-recipient">{recipientId ?? "(none)"}</span>
    </div>
  ),
}));

// InboxShell instantiates a Supabase client (Realtime) and the auth hook at mount;
// stub both so the shell renders in isolation.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
      unsubscribe: vi.fn(),
    }),
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const baseConversation: Conversation = {
  id: "c1",
  participant_1_id: "user-1",
  participant_2_id: "user-2",
  context_type: "general",
  context_id: null,
  last_message_at: new Date("2026-06-20T10:00:00Z"),
  created_at: new Date("2026-06-19T10:00:00Z"),
  participant_name: "Jane Doe",
  last_message_preview: "Hello there",
  unread_count: 1,
  archived_at: null,
  blocked_at: null,
  draft_text: null,
  has_sent: false,
};

const archivedConversation: Conversation = {
  ...baseConversation,
  id: "c2",
  participant_name: "Archived Person",
  archived_at: new Date("2026-06-20T11:00:00Z"),
  unread_count: 0,
};

vi.mock("@/hooks/useInbox", () => ({
  useInboxFolders: () => ({
    conversations: [baseConversation, archivedConversation],
    counts: { inbox: 1, unread: 1, sent: 0, drafts: 0, archived: 1, spam: 0 },
    filterByFolder: (folder: string) =>
      folder === "archived" ? [archivedConversation] : [baseConversation],
    isLoading: false,
    error: null,
  }),
  useInbox: () => ({ data: { conversations: [baseConversation] }, isLoading: false, error: null }),
  useArchiveConversation: () => ({ mutate: vi.fn() }),
  useBlockConversation: () => ({ mutate: vi.fn() }),
}));

import InboxShell from "./InboxShell";

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("InboxShell", () => {
  it("renders the folder rail, the conversation list, and the thread region", () => {
    renderWithClient(<InboxShell />);

    // Folder rail
    expect(screen.getByRole("navigation", { name: /folders/i })).toBeInTheDocument();
    // Conversation list (listbox a11y from InboxList)
    expect(screen.getByRole("listbox", { name: /conversations/i })).toBeInTheDocument();
    // Thread region empty-state placeholder
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it("shows the inbox folder conversations by default", () => {
    renderWithClient(<InboxShell />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.queryByText("Archived Person")).not.toBeInTheDocument();
  });

  it("passes the participant name (and recipient id) to the open thread", () => {
    renderWithClient(<InboxShell />);

    // Open the conversation from the list.
    fireEvent.click(screen.getByText("Jane Doe"));

    // The thread header must receive the real participant name, not "Conversation".
    expect(screen.getByTestId("thread-name")).toHaveTextContent("Jane Doe");
    expect(screen.getByTestId("thread-recipient")).toHaveTextContent("user-2");
  });
});
