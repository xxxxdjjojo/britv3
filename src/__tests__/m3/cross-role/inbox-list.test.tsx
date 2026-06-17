import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createMockConversation } from "../../fixtures/messaging";

// Drive the list through its data hooks so loading / error / empty / data
// states are deterministic with no network or auth dependency.
const useInboxMock = vi.fn();
vi.mock("@/hooks/useInbox", () => ({ useInbox: () => useInboxMock() }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-aaa" }, loading: false }),
}));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

import InboxList from "@/components/messaging/InboxList";

describe("InboxList states", () => {
  beforeEach(() => {
    useInboxMock.mockReset();
  });

  it("renders skeleton rows while loading", () => {
    useInboxMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = render(<InboxList />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders an error message on error", () => {
    useInboxMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    });
    render(<InboxList />);
    expect(screen.getByText("Failed to load conversations")).toBeInTheDocument();
  });

  it("renders the empty state when there are no conversations", () => {
    useInboxMock.mockReturnValue({
      data: { conversations: [] },
      isLoading: false,
      error: null,
    });
    render(<InboxList />);
    expect(screen.getByText("No conversations found")).toBeInTheDocument();
  });

  it("renders conversation rows with participant name and preview", () => {
    useInboxMock.mockReturnValue({
      data: {
        conversations: [
          createMockConversation({
            id: "c1",
            participant_name: "Alice Johnson",
            last_message_preview: "About the boiler",
            unread_count: 0,
          }),
        ],
      },
      isLoading: false,
      error: null,
    });
    render(<InboxList />);
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("About the boiler")).toBeInTheDocument();
  });

  it("marks unread conversations in the accessible label", () => {
    useInboxMock.mockReturnValue({
      data: {
        conversations: [createMockConversation({ id: "c1", unread_count: 3 })],
      },
      isLoading: false,
      error: null,
    });
    render(<InboxList />);
    const row = screen.getByRole("option");
    expect(row.getAttribute("aria-label")).toContain("unread");
  });

  it("does not mark read conversations as unread", () => {
    useInboxMock.mockReturnValue({
      data: {
        conversations: [createMockConversation({ id: "c1", unread_count: 0 })],
      },
      isLoading: false,
      error: null,
    });
    render(<InboxList />);
    expect(screen.getByRole("option").getAttribute("aria-label")).not.toContain("unread");
  });

  it("invokes onSelectConversation with conversation id and other participant", () => {
    useInboxMock.mockReturnValue({
      data: {
        conversations: [
          createMockConversation({
            id: "c1",
            participant_1_id: "user-aaa",
            participant_2_id: "user-bbb",
          }),
        ],
      },
      isLoading: false,
      error: null,
    });
    const onSelect = vi.fn();
    render(<InboxList onSelectConversation={onSelect} />);
    fireEvent.click(screen.getByRole("option"));
    expect(onSelect).toHaveBeenCalledWith("c1", "user-bbb");
  });

  it("marks the active conversation as selected", () => {
    useInboxMock.mockReturnValue({
      data: { conversations: [createMockConversation({ id: "c1" })] },
      isLoading: false,
      error: null,
    });
    render(<InboxList activeId="c1" />);
    expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
  });
});
