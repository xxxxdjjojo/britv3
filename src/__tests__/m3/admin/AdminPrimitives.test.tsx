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
import { CountCard } from "@/components/admin/CountCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

// next/link renders a plain anchor under test.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

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

describe("CountCard", () => {
  it("renders the title, locale-formatted count and an href link", () => {
    render(
      <CountCard
        title="Pending verifications"
        count={1234}
        href="/admin/verifications"
        icon="ShieldCheck"
      />,
    );

    expect(screen.getByText("Pending verifications")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/admin/verifications",
    );
  });

  it("renders a zero count without an icon when the icon name is unknown", () => {
    render(
      <CountCard
        title="Flagged"
        count={0}
        href="/admin/fraud"
        icon="NotARealLucideIcon"
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
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
