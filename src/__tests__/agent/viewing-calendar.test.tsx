import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewingCalendar } from "@/components/dashboard/agent/viewings/ViewingCalendar";
import type { AgentViewingSlot } from "@/types/agent";

const PROPERTY_UUID = "bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb";
const ADDRESS_LABEL = "8 Primrose Hill Road, NW1 8YD";

/** An ISO datetime for today at the given hour, so slots land on the visible month/day. */
function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function makeSlots(): AgentViewingSlot[] {
  return [
    {
      id: "slot-booked",
      agent_id: "agent-1",
      property_id: PROPERTY_UUID,
      property_label: ADDRESS_LABEL,
      start_time: todayAt(10),
      end_time: todayAt(10, 30),
      is_booked: true,
      booked_by: "buyer-uuid-1111",
      booked_by_name: null,
      notes: null,
      created_at: todayAt(9),
    },
    {
      id: "slot-available",
      agent_id: "agent-1",
      property_id: PROPERTY_UUID,
      property_label: ADDRESS_LABEL,
      start_time: todayAt(14, 30),
      end_time: todayAt(15),
      is_booked: false,
      booked_by: null,
      booked_by_name: null,
      notes: null,
      created_at: todayAt(9),
    },
  ];
}

describe("ViewingCalendar", () => {
  it("shows the human property address, not the raw listing UUID", () => {
    render(<ViewingCalendar initialSlots={makeSlots()} />);

    // The selected day defaults to today, where our slots live.
    expect(screen.getAllByText(ADDRESS_LABEL).length).toBeGreaterThan(0);
    expect(screen.queryByText(PROPERTY_UUID)).toBeNull();
  });

  it("never renders a raw buyer UUID for a booked slot", () => {
    render(<ViewingCalendar initialSlots={makeSlots()} />);

    expect(screen.queryByText(/buyer-uuid-1111/)).toBeNull();
    // The booked slot is labelled by its status instead.
    expect(screen.getAllByText("Booked").length).toBeGreaterThan(0);
  });

  it("marks calendar days that have booked and available slots with indicator dots", () => {
    render(<ViewingCalendar initialSlots={makeSlots()} />);

    expect(screen.getAllByTestId("viewing-dot-booked").length).toBeGreaterThan(0);
    expect(
      screen.getAllByTestId("viewing-dot-available").length,
    ).toBeGreaterThan(0);
  });

  it("shows the buyer name for a booked slot when booked_by_name is set", () => {
    const slots: AgentViewingSlot[] = [
      {
        id: "slot-named-buyer",
        agent_id: "agent-1",
        property_id: PROPERTY_UUID,
        property_label: ADDRESS_LABEL,
        start_time: todayAt(11),
        end_time: todayAt(11, 30),
        is_booked: true,
        booked_by: "buyer-uuid-2222",
        booked_by_name: "Jane Buyer",
        notes: null,
        created_at: todayAt(9),
      },
    ];

    render(<ViewingCalendar initialSlots={slots} />);

    // The buyer name must appear (rendered as "Buyer: Jane Buyer")
    expect(screen.getByText(/Jane Buyer/)).toBeInTheDocument();
    // The raw UUID must NOT appear
    expect(screen.queryByText(/buyer-uuid-2222/)).toBeNull();
    // The "Booked" label must still appear as its own standalone node
    expect(screen.getAllByText("Booked").length).toBeGreaterThan(0);
  });

  it("shows an empty-state message in the Publish Availability dialog when no manageable listings", () => {
    render(<ViewingCalendar initialSlots={[]} manageableListings={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /publish availability/i }));

    expect(
      screen.getByText(/you have no listings to publish availability for/i),
    ).toBeInTheDocument();
    // Raw "Property ID" text input must be gone
    expect(screen.queryByLabelText(/property id/i)).toBeNull();
    // Submit button must be disabled
    expect(screen.getByRole("button", { name: /publish slot/i })).toBeDisabled();
  });

  it("shows a Select (not a raw Property ID input) in the Publish Availability dialog when listings exist", () => {
    const manageable = [{ id: PROPERTY_UUID, label: ADDRESS_LABEL }];

    render(
      <ViewingCalendar initialSlots={[]} manageableListings={manageable} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /publish availability/i }));

    // The raw "Property ID" text input must be gone
    expect(screen.queryByLabelText(/property id/i)).toBeNull();
    // The Select trigger placeholder must be visible
    expect(screen.getByText(/select a property/i)).toBeInTheDocument();
    // The submit button must be enabled (manageable listings exist)
    expect(screen.getByRole("button", { name: /publish slot/i })).not.toBeDisabled();
  });
});
