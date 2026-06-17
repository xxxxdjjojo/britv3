/**
 * Render smoke-test for NotificationCentreClient.
 * Mocks all data hooks so the component renders without a real Supabase
 * connection. Asserts the heading, "Recent Activity" section label, a
 * notification row, and the tab bar.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PlatformEvent } from "@/types/notifications";

// ---------------------------------------------------------------------------
// Mocks — must appear before the import that triggers them
// ---------------------------------------------------------------------------

const mockNotification: PlatformEvent = {
  id: "notif-1",
  event_type: "new_message",
  actor_name: "Alice",
  entity_type: "conversation",
  entity_id: "conv-123",
  created_at: new Date(Date.now() - 300_000).toISOString(), // 5 min ago
  recipient_id: "user-1",
};

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: vi.fn(() => ({
    data: {
      notifications: [mockNotification],
      lastReadAt: null,
      nextCursor: null,
    },
    isLoading: false,
    refetch: vi.fn(),
  })),
  useMarkAllRead: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useNotificationCount: vi.fn(() => ({
    data: { count: 1 },
  })),
}));

// posthog is used in NotificationItem (not rendered here, but guard the import)
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

// ---------------------------------------------------------------------------
// Import under test (after mocks are set up)
// ---------------------------------------------------------------------------

import NotificationCentreClient from "@/app/(protected)/notifications/NotificationCentreClient";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationCentreClient layout", () => {
  beforeEach(() => {
    render(<NotificationCentreClient />);
  });

  it("renders the page heading", () => {
    expect(
      screen.getByRole("heading", { name: /notification centre/i }),
    ).toBeInTheDocument();
  });

  it("renders the Recent Activity section label", () => {
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
  });

  it("renders a notification row for the mocked event", () => {
    expect(
      screen.getByText(/alice sent you a message/i),
    ).toBeInTheDocument();
  });

  it("renders All / Unread / System tabs", () => {
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unread/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^system$/i })).toBeInTheDocument();
  });

  it("renders the mark-all-as-read action", () => {
    expect(
      screen.getByRole("button", { name: /mark all as read/i }),
    ).toBeInTheDocument();
  });
});
