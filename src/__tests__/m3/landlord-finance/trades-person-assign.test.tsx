import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  TradesPersonAssignModal,
  type ProviderResult,
} from "@/components/landlord/TradesPersonAssignModal";

const PROVIDERS: ProviderResult[] = [
  { id: "p1", business_name: "Acme Plumbing", category: "plumber", average_rating: 4.8, city: "London" },
  { id: "p2", business_name: "Spark Electrical", category: "electrician", average_rating: 4.2, city: "Leeds" },
  { id: "p3", business_name: "Bright Sparks", category: "electrician", average_rating: null, city: null },
];

function renderModal(overrides: Partial<React.ComponentProps<typeof TradesPersonAssignModal>> = {}) {
  const onAssign = vi.fn();
  const props = {
    maintenanceCategory: "electrical",
    propertyPostcode: "NW1 6XE",
    providers: PROVIDERS,
    onAssign,
    isAssigning: false,
    ...overrides,
  };
  render(<TradesPersonAssignModal {...props} />);
  return { onAssign };
}

describe("TradesPersonAssignModal", () => {
  it("renders all providers initially", () => {
    renderModal();
    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Spark Electrical")).toBeInTheDocument();
    expect(screen.getByText("Bright Sparks")).toBeInTheDocument();
  });

  it("renders empty state with onboarding hint when no providers", () => {
    renderModal({ providers: [] });
    expect(screen.getByText("No providers found.")).toBeInTheDocument();
    expect(
      screen.getByText(/Marketplace providers will appear here once registered/i),
    ).toBeInTheDocument();
  });

  it("filters by search query (case-insensitive)", () => {
    renderModal();
    const search = screen.getByPlaceholderText(/Search providers by name/i);
    fireEvent.change(search, { target: { value: "acme" } });
    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
    expect(screen.queryByText("Spark Electrical")).not.toBeInTheDocument();
  });

  it("shows a no-results message when search matches nothing", () => {
    renderModal();
    const search = screen.getByPlaceholderText(/Search providers by name/i);
    fireEvent.change(search, { target: { value: "zzzz" } });
    expect(screen.getByText("No providers found.")).toBeInTheDocument();
  });

  it("filters by category chip", () => {
    renderModal();
    // Category chip label for plumber is "Plumbing"
    fireEvent.click(screen.getByRole("button", { name: "Plumbing" }));
    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
    expect(screen.queryByText("Spark Electrical")).not.toBeInTheDocument();
    expect(screen.queryByText("Bright Sparks")).not.toBeInTheDocument();
  });

  it("resets to all providers via the All Categories chip", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Plumbing" }));
    fireEvent.click(screen.getByRole("button", { name: "All Categories" }));
    expect(screen.getByText("Acme Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Spark Electrical")).toBeInTheDocument();
  });

  it("calls onAssign with provider id when Assign is clicked", () => {
    const { onAssign } = renderModal();
    const row = screen.getByText("Acme Plumbing").closest("div.rounded-xl");
    expect(row).not.toBeNull();
    const assignBtn = within(row as HTMLElement).getByRole("button", { name: "Assign" });
    fireEvent.click(assignBtn);
    expect(onAssign).toHaveBeenCalledWith("p1");
  });

  it("labels the currently assigned provider with Reassign", () => {
    renderModal({ currentAssignedId: "p2" });
    const row = screen.getByText("Spark Electrical").closest("div.rounded-xl");
    expect(within(row as HTMLElement).getByRole("button", { name: "Reassign" })).toBeInTheDocument();
  });

  it("disables assign buttons while assigning", () => {
    renderModal({ isAssigning: true });
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent === "Assign" || b.textContent === "Reassign");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it("renders rating only when present", () => {
    renderModal();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    // Bright Sparks has null rating — no rating text for it
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });
});
