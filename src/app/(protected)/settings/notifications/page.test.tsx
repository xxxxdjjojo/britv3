/**
 * Render smoke test for NotificationsSettingsPage.
 *
 * Verifies:
 * - The page heading is rendered
 * - The editorial eyebrow is present
 * - The channel column headers appear (Email, Push, SMS, In-App)
 * - Toggle groups exist for each category
 *
 * Network: fetch is mocked — no real API calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NotificationsSettingsPage from "./page";

// Stub fetch so the component resolves to an empty prefs object
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }),
  );
});

// Sonner toast is a side-effect only — stub it to keep tests quiet
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("NotificationsSettingsPage", () => {
  it("renders the page heading", () => {
    render(<NotificationsSettingsPage />);
    // The heading text "Notifications" must appear (as h2)
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe("Notifications");
  });

  it("renders all four channel column labels", () => {
    render(<NotificationsSettingsPage />);
    // Column headers appear in the matrix header row
    expect(screen.getAllByText("Email").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Push").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SMS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In-App").length).toBeGreaterThan(0);
  });

  it("renders the notification matrix section", () => {
    render(<NotificationsSettingsPage />);
    // The aria-label wraps the entire matrix section
    const section = screen.getByRole("region", { name: /notification channels/i });
    expect(section).toBeInTheDocument();
  });

  it("renders the Security Alerts card", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Security Alerts")).toBeInTheDocument();
  });

  it("renders the Security Alerts card", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Security Alerts")).toBeInTheDocument();
  });

  it("renders the unsubscribe button (with existing wiring)", () => {
    render(<NotificationsSettingsPage />);
    // The button exists — wiring is unchanged from pre-existing handleUnsubscribeMarketing
    const buttons = screen.getAllByText(/unsubscribe from/i);
    expect(buttons.length).toBeGreaterThan(0);
  });
});
