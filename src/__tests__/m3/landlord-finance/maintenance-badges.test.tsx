import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MaintenanceStatusBadge } from "@/components/landlord/MaintenanceStatusBadge";
import { MaintenancePriorityBadge } from "@/components/landlord/MaintenancePriorityBadge";
import type { MaintenanceStatus, MaintenancePriority } from "@/types/landlord";

// Deterministic presentational badge tests. No network, no timers.

describe("MaintenanceStatusBadge", () => {
  const cases: [MaintenanceStatus, string][] = [
    ["new", "New"],
    ["acknowledged", "Acknowledged"],
    ["assigned", "Assigned"],
    ["in_progress", "In Progress"],
    ["resolved", "Resolved"],
    ["closed", "Closed"],
  ];

  it.each(cases)("renders %s status as label %s", (status, label) => {
    render(<MaintenanceStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("MaintenancePriorityBadge", () => {
  const cases: [MaintenancePriority, string][] = [
    ["emergency", "Emergency"],
    ["high", "High"],
    // medium maps to the "Routine" label intentionally in the component
    ["medium", "Routine"],
    ["low", "Low"],
  ];

  it.each(cases)("renders %s priority as label %s", (priority, label) => {
    render(<MaintenancePriorityBadge priority={priority} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("marks the priority icon as decorative (aria-hidden)", () => {
    const { container } = render(<MaintenancePriorityBadge priority="emergency" />);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
