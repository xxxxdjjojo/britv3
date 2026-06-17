import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PlatformEvent } from "@/types/notifications";

// Drive the feed purely through the useNotifications hook so we get
// deterministic loading / error / empty / data states with no network.
const useNotificationsMock = vi.fn();
vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: (cursor?: string) => useNotificationsMock(cursor),
}));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import NotificationFeed from "@/components/notifications/NotificationFeed";

function makeEvent(id: number): PlatformEvent {
  return {
    id,
    event_type: "new_message",
    entity_type: "conversation",
    entity_id: `conv-${id}`,
    actor_id: "user-aaa",
    metadata: {},
    created_at: new Date("2026-01-15T11:00:00Z"),
    actor_name: `Sender ${id}`,
  };
}

describe("NotificationFeed states", () => {
  beforeEach(() => {
    useNotificationsMock.mockReset();
  });

  it("renders skeletons while loading", () => {
    useNotificationsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = render(<NotificationFeed />);
    // Skeleton component renders elements with the data-slot / animate-pulse marker
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders an error message on error", () => {
    useNotificationsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    });
    render(<NotificationFeed />);
    expect(screen.getByText("Failed to load notifications.")).toBeInTheDocument();
  });

  it("renders the empty 'all caught up' state", () => {
    useNotificationsMock.mockReturnValue({
      data: { notifications: [], lastReadAt: null, nextCursor: null },
      isLoading: false,
      error: null,
    });
    render(<NotificationFeed />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it("renders notification rows when data is present", () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [makeEvent(1), makeEvent(2)],
        lastReadAt: null,
        nextCursor: null,
      },
      isLoading: false,
      error: null,
    });
    render(<NotificationFeed />);
    expect(screen.getByText("Sender 1 sent you a message")).toBeInTheDocument();
    expect(screen.getByText("Sender 2 sent you a message")).toBeInTheDocument();
  });

  it("caps compact mode at 5 items", () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: Array.from({ length: 8 }, (_, i) => makeEvent(i + 1)),
        lastReadAt: null,
        nextCursor: "cursor-x",
      },
      isLoading: false,
      error: null,
    });
    render(<NotificationFeed compact />);
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("shows 'Load more' in full mode when nextCursor exists", () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [makeEvent(1)],
        lastReadAt: null,
        nextCursor: "cursor-x",
      },
      isLoading: false,
      error: null,
    });
    render(<NotificationFeed />);
    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
  });

  it("hides 'Load more' in compact mode even with a nextCursor", () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [makeEvent(1)],
        lastReadAt: null,
        nextCursor: "cursor-x",
      },
      isLoading: false,
      error: null,
    });
    render(<NotificationFeed compact />);
    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
  });
});
