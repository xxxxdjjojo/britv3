import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotificationItem from "@/components/notifications/NotificationItem";
import type { PlatformEvent, EventType, EntityType } from "@/types/notifications";

// next/link renders a plain anchor in tests; posthog must be mocked (no network).
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const FIXED_NOW = new Date("2026-01-15T12:00:00Z").getTime();

function makeEvent(overrides?: Partial<PlatformEvent>): PlatformEvent {
  return {
    id: 1,
    event_type: "new_message",
    entity_type: "conversation",
    entity_id: "conv-1",
    actor_id: "user-aaa",
    metadata: {},
    created_at: new Date("2026-01-15T11:59:30Z"), // 30s before "now"
    actor_name: "Alice Johnson",
    ...overrides,
  };
}

describe("NotificationItem description mapping", () => {
  const cases: ReadonlyArray<{ type: EventType; expected: string }> = [
    { type: "new_message", expected: "Alice Johnson sent you a message" },
    { type: "quote_received", expected: "Alice Johnson sent you a quote" },
    { type: "quote_sent", expected: "You sent a quote to Alice Johnson" },
    { type: "booking_confirmed", expected: "Booking with Alice Johnson confirmed" },
    { type: "booking_updated", expected: "Alice Johnson updated a booking" },
    { type: "milestone_updated", expected: "Alice Johnson updated a milestone" },
    { type: "offer_received", expected: "Alice Johnson made an offer on your property" },
    { type: "viewing_scheduled", expected: "Alice Johnson scheduled a viewing" },
    { type: "review_posted", expected: "Alice Johnson posted a review" },
    { type: "maintenance_request_created", expected: "Alice Johnson submitted a maintenance request" },
  ];

  it.each(cases)("renders description for $type", ({ type, expected }) => {
    render(<NotificationItem event={makeEvent({ event_type: type })} lastReadAt={null} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("falls back to 'Someone' when actor_name is null", () => {
    render(<NotificationItem event={makeEvent({ actor_name: null })} lastReadAt={null} />);
    expect(screen.getByText("Someone sent you a message")).toBeInTheDocument();
  });
});

describe("NotificationItem navigation URL mapping", () => {
  const cases: ReadonlyArray<{ entity: EntityType; id: string; hrefIncludes: string }> = [
    { entity: "conversation", id: "c1", hrefIncludes: "/inbox/c1" },
    { entity: "booking", id: "b1", hrefIncludes: "/bookings/b1" },
    { entity: "listing", id: "l1", hrefIncludes: "/listings/l1" },
    { entity: "rfq", id: "r1", hrefIncludes: "/quotes/r1" },
    { entity: "transaction", id: "t1", hrefIncludes: "/transactions/t1" },
    { entity: "maintenance_request", id: "m1", hrefIncludes: "/dashboard/landlord/maintenance" },
  ];

  it.each(cases)("links $entity to the right route", ({ entity, id, hrefIncludes }) => {
    render(
      <NotificationItem
        event={makeEvent({ entity_type: entity, entity_id: id })}
        lastReadAt={null}
      />,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain(hrefIncludes);
  });
});

describe("NotificationItem unread state", () => {
  it("marks unread when lastReadAt is null", () => {
    render(<NotificationItem event={makeEvent()} lastReadAt={null} />);
    expect(screen.getByRole("link").getAttribute("aria-label")).toContain("unread");
  });

  it("marks unread when created_at is after lastReadAt", () => {
    render(
      <NotificationItem
        event={makeEvent({ created_at: new Date("2026-01-15T11:00:00Z") })}
        lastReadAt={"2026-01-15T10:00:00Z"}
      />,
    );
    expect(screen.getByRole("link").getAttribute("aria-label")).toContain("unread");
  });

  it("marks read when created_at is before lastReadAt", () => {
    render(
      <NotificationItem
        event={makeEvent({ created_at: new Date("2026-01-15T09:00:00Z") })}
        lastReadAt={"2026-01-15T10:00:00Z"}
      />,
    );
    expect(screen.getByRole("link").getAttribute("aria-label")).not.toContain("unread");
  });
});

describe("NotificationItem timeAgo", () => {
  it("shows 'just now' for sub-minute events", () => {
    vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
    render(<NotificationItem event={makeEvent()} lastReadAt={null} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("shows minutes for events under an hour old", () => {
    vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
    render(
      <NotificationItem
        event={makeEvent({ created_at: new Date("2026-01-15T11:30:00Z") })}
        lastReadAt={null}
      />,
    );
    expect(screen.getByText("30m ago")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("shows hours for events under a day old", () => {
    vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
    render(
      <NotificationItem
        event={makeEvent({ created_at: new Date("2026-01-15T09:00:00Z") })}
        lastReadAt={null}
      />,
    );
    expect(screen.getByText("3h ago")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
