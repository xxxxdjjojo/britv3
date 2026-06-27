import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createMockConversation } from "../../fixtures/messaging";

// InboxList is now prop-driven (the shell owns the data hook). It still uses the
// archive/block mutation hooks and useAuth, so stub those and wrap in a client.
vi.mock("@/hooks/useInbox", () => ({
  useArchiveConversation: () => ({ mutate: vi.fn() }),
  useBlockConversation: () => ({ mutate: vi.fn() }),
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
