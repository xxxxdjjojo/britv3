import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MaintenanceList } from "@/components/landlord/MaintenanceList";
import type { MaintenanceRequest } from "@/types/landlord";

function buildRequest(
  overrides: Partial<MaintenanceRequest> = {},
): MaintenanceRequest {
  return {
    id: "req-1",
    property_id: "prop-1",
    tenancy_id: "ten-1",
    reported_by: "tenant-1",
    title: "Leaking kitchen tap",
    description: "Tap drips constantly.",
    priority: "high",
    status: "new",
    assigned_provider_id: null,
    assigned_provider_name: null,
    resolution_notes: null,
    resolved_at: null,
    photo_urls: [],
    created_at: "2026-03-01T10:00:00.000Z",
    updated_at: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("MaintenanceList", () => {
  it("renders empty state when there are no requests", () => {
    render(<MaintenanceList requests={[]} />);
    expect(screen.getByText("No maintenance requests")).toBeInTheDocument();
  });

  it("renders one row per request with title, priority and status", () => {
    const requests = [
      buildRequest({ id: "a", title: "Boiler broken", priority: "emergency", status: "new" }),
      buildRequest({ id: "b", title: "Door handle loose", priority: "low", status: "resolved" }),
    ];
    render(<MaintenanceList requests={requests} />);

    expect(screen.getByText("Boiler broken")).toBeInTheDocument();
    expect(screen.getByText("Door handle loose")).toBeInTheDocument();
    // PriorityBadge renders the raw priority text (capitalized via CSS)
    expect(screen.getByText("emergency")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
    // Status badge labels
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("links each row to the request detail page", () => {
    render(<MaintenanceList requests={[buildRequest({ id: "xyz" })]} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "maintenance/xyz");
  });

  it("falls back to medium priority style for an unknown priority", () => {
    // The component looks up PRIORITY_STYLES[priority] ?? medium.
    // An unknown priority value must still render without throwing.
    const req = buildRequest({ priority: "weird" as MaintenanceRequest["priority"] });
    render(<MaintenanceList requests={[req]} />);
    expect(screen.getByText("weird")).toBeInTheDocument();
  });
});
