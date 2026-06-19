import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import type { BookingStatus } from "@/types/marketplace";

// Pure prop-driven status badge: every BookingStatus maps to a label + colour.

const CASES: ReadonlyArray<{ status: BookingStatus; label: string; colour: string }> = [
  { status: "pending_confirmation", label: "Pending", colour: "yellow" },
  { status: "confirmed", label: "Confirmed", colour: "blue" },
  { status: "in_progress", label: "In Progress", colour: "orange" },
  { status: "completed", label: "Completed", colour: "green" },
  { status: "cancelled", label: "Cancelled", colour: "red" },
  { status: "disputed", label: "Disputed", colour: "purple" },
];

describe("BookingStatusBadge", () => {
  it.each(CASES)("renders label '$label' for status $status", ({ status, label }) => {
    render(<BookingStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each(CASES)("applies $colour colour classes for status $status", ({ status, colour }) => {
    const { container } = render(<BookingStatusBadge status={status} />);
    expect(container.firstChild).toHaveClass(`bg-${colour}-100`, `text-${colour}-800`);
  });

  it("merges a caller-supplied className", () => {
    const { container } = render(
      <BookingStatusBadge status="confirmed" className="custom-marker" />,
    );
    expect(container.firstChild).toHaveClass("custom-marker");
  });

  it("renders all six statuses with distinct labels", () => {
    const labels = CASES.map((c) => c.label);
    expect(new Set(labels).size).toBe(6);
  });
});
