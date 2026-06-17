import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PlatformEvent, EventType } from "@/types/notifications";

const useNotificationsMock = vi.fn();
const useNotificationCountMock = vi.fn();
const markAllReadMutate = vi.fn();
const useMarkAllReadMock = vi.fn(() => ({ mutate: markAllReadMutate, isPending: false }));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: (cursor?: string) => useNotificationsMock(cursor),
  useNotificationCount: () => useNotificationCountMock(),
  useMarkAllRead: () => useMarkAllReadMock(),
}));

import NotificationCentreClient from "@/app/(protected)/notifications/NotificationCentreClient";

function event(id: number, eventType: EventType, createdAt: string): PlatformEvent {
  return {
    id,
    event_type: eventType,
    entity_type: "conversation",
    entity_id: `e-${id}`,
    actor_id: "user-aaa",
    metadata: {},
    created_at: new Date(createdAt),
    actor_name: `Actor ${id}`,
  };
}

function setNotifications(
  notifications: PlatformEvent[],
  opts?: { lastReadAt?: string | null; isLoading?: boolean; count?: number },
) {
  useNotificationsMock.mockReturnValue({
    data: {
      notifications,
      lastReadAt: opts?.lastReadAt ?? null,
      nextCursor: null,
    },
    isLoading: opts?.isLoading ?? false,
    refetch: vi.fn(),
  });
  useNotificationCountMock.mockReturnValue({ data: { count: opts?.count ?? 0 } });
}

describe("NotificationCentreClient tabs and mark-all", () => {
  beforeEach(() => {
    useNotificationsMock.mockReset();
    useNotificationCountMock.mockReset();
    markAllReadMutate.mockReset();
  });

  it("renders the All / Unread / System tabs and total count", () => {
    setNotifications([event(1, "new_message", "2026-01-15T11:00:00Z")], { count: 3 });
    render(<NotificationCentreClient />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Unread \(3\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toBeInTheDocument();
    expect(screen.getByText("1 notifications")).toBeInTheDocument();
  });

  it("shows skeletons while loading", () => {
    setNotifications([], { isLoading: true });
    const { container } = render(<NotificationCentreClient />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no notifications", () => {
    setNotifications([]);
    render(<NotificationCentreClient />);
    expect(screen.getByText("No notifications here")).toBeInTheDocument();
  });

  it("renders all notifications on the All tab", () => {
    setNotifications([
      event(1, "new_message", "2026-01-15T11:00:00Z"),
      event(2, "offer_received", "2026-01-15T10:00:00Z"),
    ]);
    render(<NotificationCentreClient />);
    expect(screen.getByText("Actor 1 sent you a message")).toBeInTheDocument();
    expect(screen.getByText("Actor 2 made an offer on your property")).toBeInTheDocument();
  });

  it("filters to only system events on the System tab", () => {
    setNotifications([
      event(1, "new_message", "2026-01-15T11:00:00Z"),
      event(2, "booking_confirmed", "2026-01-15T10:00:00Z"),
    ]);
    render(<NotificationCentreClient />);
    fireEvent.click(screen.getByRole("button", { name: "System" }));
    expect(screen.getByText("Booking with Actor 2 confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Actor 1 sent you a message")).not.toBeInTheDocument();
  });

  it("filters to only unread events on the Unread tab", () => {
    setNotifications(
      [
        event(1, "new_message", "2026-01-15T11:00:00Z"), // after lastRead → unread
        event(2, "offer_received", "2026-01-15T08:00:00Z"), // before lastRead → read
      ],
      { lastReadAt: "2026-01-15T10:00:00Z" },
    );
    render(<NotificationCentreClient />);
    fireEvent.click(screen.getByRole("button", { name: /Unread/ }));
    expect(screen.getByText("Actor 1 sent you a message")).toBeInTheDocument();
    expect(screen.queryByText("Actor 2 made an offer on your property")).not.toBeInTheDocument();
  });

  it("calls the mark-all-read mutation when the button is clicked", () => {
    setNotifications([event(1, "new_message", "2026-01-15T11:00:00Z")]);
    render(<NotificationCentreClient />);
    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(markAllReadMutate).toHaveBeenCalledTimes(1);
  });
});
