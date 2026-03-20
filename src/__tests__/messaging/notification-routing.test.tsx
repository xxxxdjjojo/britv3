import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotificationItem from "@/components/notifications/NotificationItem";
import type { PlatformEvent } from "@/types/notifications";

function makeEvent(overrides: Partial<PlatformEvent> = {}): PlatformEvent {
  return {
    id: "evt-1",
    event_type: "new_message",
    entity_type: "conversation",
    entity_id: "conv-abc-123",
    actor_id: "user-1",
    actor_name: "James",
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides,
  } as PlatformEvent;
}

describe("NotificationItem routing", () => {
  it("routes conversation notifications to /inbox/ not /messages/", () => {
    const event = makeEvent({
      entity_type: "conversation",
      entity_id: "conv-abc-123",
    });

    render(<NotificationItem event={event} lastReadAt={null} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/inbox/conv-abc-123");
  });

  it("routes booking notifications to /bookings/", () => {
    const event = makeEvent({
      event_type: "booking_confirmed",
      entity_type: "booking",
      entity_id: "booking-xyz",
    });

    render(<NotificationItem event={event} lastReadAt={null} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/bookings/booking-xyz");
  });

  it("falls back to /notifications for unknown entity types", () => {
    const event = makeEvent({
      entity_type: "unknown" as PlatformEvent["entity_type"],
      entity_id: "xxx",
    });

    render(<NotificationItem event={event} lastReadAt={null} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/notifications");
  });
});
