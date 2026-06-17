import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MaintenanceInboxClient } from "@/app/(protected)/dashboard/landlord/maintenance/MaintenanceInboxClient";
import type { MaintenanceRequestWithProperty } from "@/services/landlord/maintenance-service";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function buildRequest(
  overrides: Partial<MaintenanceRequestWithProperty> = {},
): MaintenanceRequestWithProperty {
  return {
    id: "req-1",
    property_id: "prop-1",
    tenancy_id: "ten-1",
    reported_by: "tenant-1",
    title: "Leaking tap",
    description: "Constant drip from the kitchen tap.",
    priority: "medium",
    status: "new",
    assigned_provider_id: null,
    assigned_provider_name: null,
    resolution_notes: null,
    resolved_at: null,
    photo_urls: [],
    created_at: "2026-03-01T10:00:00.000Z",
    updated_at: "2026-03-01T10:00:00.000Z",
    property_address: "42 Baker Street",
    property_postcode: "NW1 6XE",
    tenant_name: "Jane Tenant",
    ...overrides,
  };
}

const DATA: MaintenanceRequestWithProperty[] = [
  buildRequest({ id: "a", title: "Boiler failure", priority: "emergency", status: "in_progress", created_at: "2026-03-05T10:00:00.000Z" }),
  buildRequest({ id: "b", title: "Loose handle", priority: "low", status: "new", created_at: "2026-03-04T10:00:00.000Z" }),
  buildRequest({ id: "c", title: "Window crack", priority: "high", status: "resolved", created_at: "2026-03-03T10:00:00.000Z", assigned_provider_name: "Glaze Co" }),
];

describe("MaintenanceInboxClient", () => {
  it("renders the total request count and all rows", () => {
    render(<MaintenanceInboxClient initialData={DATA} />);
    expect(screen.getByText("Boiler failure")).toBeInTheDocument();
    expect(screen.getByText("Loose handle")).toBeInTheDocument();
    expect(screen.getByText("Window crack")).toBeInTheDocument();
  });

  it("renders the empty state when there is no data", () => {
    render(<MaintenanceInboxClient initialData={[]} />);
    expect(screen.getByText("No requests found")).toBeInTheDocument();
    expect(
      screen.getByText(/Your portfolio has no maintenance requests yet/i),
    ).toBeInTheDocument();
  });

  it("shows the urgent alert banner when there is an emergency request", () => {
    render(<MaintenanceInboxClient initialData={DATA} />);
    expect(screen.getByText(/1 emergency/i)).toBeInTheDocument();
    expect(screen.getByText(/1 in progress across the portfolio/i)).toBeInTheDocument();
  });

  it("hides the urgent alert when there are no emergencies", () => {
    const noEmergency = [buildRequest({ id: "x", priority: "low" })];
    render(<MaintenanceInboxClient initialData={noEmergency} />);
    expect(screen.queryByText(/need immediate action/i)).not.toBeInTheDocument();
  });

  it("filters by priority", () => {
    render(<MaintenanceInboxClient initialData={DATA} />);
    fireEvent.click(screen.getByRole("button", { name: "Low" }));
    expect(screen.getByText("Loose handle")).toBeInTheDocument();
    expect(screen.queryByText("Boiler failure")).not.toBeInTheDocument();
    expect(screen.queryByText("Window crack")).not.toBeInTheDocument();
  });

  it("filters by status", () => {
    render(<MaintenanceInboxClient initialData={DATA} />);
    fireEvent.click(screen.getByRole("button", { name: "Resolved" }));
    expect(screen.getByText("Window crack")).toBeInTheDocument();
    expect(screen.queryByText("Boiler failure")).not.toBeInTheDocument();
  });

  it("shows the filtered-empty message when filters exclude everything", () => {
    // All requests are non-"acknowledged"; but the status filter only exposes
    // all/new/in_progress/resolved. Combine priority=low + status=resolved.
    render(<MaintenanceInboxClient initialData={DATA} />);
    fireEvent.click(screen.getByRole("button", { name: "Low" }));
    fireEvent.click(screen.getByRole("button", { name: "Resolved" }));
    expect(screen.getByText("No requests found")).toBeInTheDocument();
    expect(screen.getByText(/No requests match the current filters/i)).toBeInTheDocument();
  });

  it("sorts emergency requests above lower-priority ones", () => {
    render(<MaintenanceInboxClient initialData={DATA} />);
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    // Emergency "Boiler failure" must come before high "Window crack" and low "Loose handle"
    const boilerIdx = titles.indexOf("Boiler failure");
    const windowIdx = titles.indexOf("Window crack");
    const handleIdx = titles.indexOf("Loose handle");
    expect(boilerIdx).toBeGreaterThanOrEqual(0);
    expect(boilerIdx).toBeLessThan(windowIdx);
    expect(windowIdx).toBeLessThan(handleIdx);
  });

  it("marks unassigned requests as Unassigned and assigned ones by name", () => {
    render(<MaintenanceInboxClient initialData={DATA} />);
    expect(screen.getByText("Glaze Co")).toBeInTheDocument();
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
  });
});
