import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createMockConversation } from "../../fixtures/messaging";

// Hoisted spies so they are accessible in tests that assert on them.
const archiveMutate = vi.fn();
const blockMutate = vi.fn();

// InboxList is now prop-driven (the shell owns the data hook). It still uses the
// archive/block mutation hooks and useAuth, so stub those and wrap in a client.
vi.mock("@/hooks/useInbox", () => ({
  useArchiveConversation: () => ({ mutate: archiveMutate }),
  useBlockConversation: () => ({ mutate: blockMutate }),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-aaa" }, loading: false }),
}));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

import InboxList from "@/components/messaging/InboxList";

function renderList(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("InboxList states", () => {
  it("renders skeleton rows while loading", () => {
    const { container } = renderList(
      <InboxList conversations={[]} folder="inbox" isLoading />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders an error message on error", () => {
    renderList(
      <InboxList conversations={[]} folder="inbox" error={new Error("boom")} />,
    );
    expect(screen.getByText("Failed to load conversations")).toBeInTheDocument();
  });

  it("renders the folder-specific empty state when there are no conversations", () => {
    renderList(<InboxList conversations={[]} folder="archived" />);
    expect(screen.getByText("No archived conversations")).toBeInTheDocument();
  });

  it("renders conversation rows with participant name and preview", () => {
    renderList(
      <InboxList
        folder="inbox"
        conversations={[
          createMockConversation({
            id: "c1",
            participant_name: "Alice Johnson",
            last_message_preview: "About the boiler",
            unread_count: 0,
          }),
        ]}
      />,
    );
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("About the boiler")).toBeInTheDocument();
  });

  it("marks unread conversations in the accessible label", () => {
    renderList(
      <InboxList
        folder="inbox"
        conversations={[createMockConversation({ id: "c1", unread_count: 3 })]}
      />,
    );
    const row = screen.getByRole("option");
    expect(row.getAttribute("aria-label")).toContain("unread");
  });

  it("does not mark read conversations as unread", () => {
    renderList(
      <InboxList
        folder="inbox"
        conversations={[createMockConversation({ id: "c1", unread_count: 0 })]}
      />,
    );
    expect(screen.getByRole("option").getAttribute("aria-label")).not.toContain("unread");
  });

  it("invokes onSelectConversation with conversation id and other participant", () => {
    const onSelect = vi.fn();
    renderList(
      <InboxList
        folder="inbox"
        onSelectConversation={onSelect}
        conversations={[
          createMockConversation({
            id: "c1",
            participant_1_id: "user-aaa",
            participant_2_id: "user-bbb",
          }),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("option"));
    expect(onSelect).toHaveBeenCalledWith("c1", "user-bbb");
  });

  it("marks the active conversation as selected", () => {
    renderList(
      <InboxList
        folder="inbox"
        activeId="c1"
        conversations={[createMockConversation({ id: "c1" })]}
      />,
    );
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
  });
});

describe("InboxList folder actions", () => {
  it("calls archiveMutation.mutate with archived:true when Archive is clicked", () => {
    archiveMutate.mockClear();
    renderList(
      <InboxList
        folder="inbox"
        conversations={[createMockConversation({ id: "conv-001", archived_at: null })]}
      />,
    );

    // Open the overflow menu for the row then click Archive
    fireEvent.click(screen.getByRole("button", { name: /actions for/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /archive/i }));

    expect(archiveMutate).toHaveBeenCalledWith({ conversationId: "conv-001", archived: true });
  });

  it("calls blockMutation.mutate with blocked:true when Mark as spam is clicked", () => {
    blockMutate.mockClear();
    renderList(
      <InboxList
        folder="inbox"
        conversations={[createMockConversation({ id: "conv-001", blocked_at: null })]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /actions for/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /mark as spam/i }));

    expect(blockMutate).toHaveBeenCalledWith({ conversationId: "conv-001", blocked: true });
  });
});
