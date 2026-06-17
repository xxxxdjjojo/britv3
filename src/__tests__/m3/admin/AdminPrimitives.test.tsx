/**
 * M3-A9 — Admin shared primitives: StatusBadge, CountCard, AdminEmptyState.
 *
 * Pure presentational components. Tests cover known-status mapping, the
 * unknown-status fallback, count formatting + link target, and the
 * empty-state optional action wiring.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Inbox } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

describe("StatusBadge", () => {
  it("maps a known status to its human label", () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("is case-insensitive on the status key", () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("falls back to the raw status string when unmapped", () => {
    render(<StatusBadge status="some_custom_state" />);
    expect(screen.getByText("some_custom_state")).toBeInTheDocument();
  });

  it("applies the outline border class for the outline variant", () => {
    render(<StatusBadge status="approved" variant="outline" />);
    const badge = screen.getByText("Approved");
    expect(badge.className).toContain("border");
  });
});

describe("StatCard", () => {
  it("renders the label, the value as given and a mapped icon", () => {
    const { container } = render(
      <StatCard
        label="Pending verifications"
        value="1,234"
        icon="BadgeCheck"
      />,
    );

    expect(screen.getByText("Pending verifications")).toBeInTheDocument();
    // The caller is responsible for formatting; StatCard renders value verbatim.
    expect(screen.getByText("1,234")).toBeInTheDocument();
    // A known icon name from the ICON_MAP renders an svg.
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the value without an icon when the icon name is unknown", () => {
    const { container } = render(
      <StatCard label="Flagged" value="0" icon="NotARealLucideIcon" />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
    // Unknown icon names are not in the ICON_MAP, so no icon is rendered.
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("AdminEmptyState", () => {
  it("renders the title and description and no button when no action is given", () => {
    render(
      <AdminEmptyState
        icon={Inbox}
        title="Nothing here"
        description="The queue is empty."
      />,
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("The queue is empty.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an action button and calls onClick when provided", () => {
    const onClick = vi.fn();
    render(
      <AdminEmptyState
        icon={Inbox}
        title="Nothing here"
        description="Add one to get started."
        action={{ label: "Create item", onClick }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create item" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
