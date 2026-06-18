/**
 * M3-A9 — FraudDetectionClient (row select, select-all, bulk-suspend confirm).
 *
 * Renders a fraud signal table with per-row checkboxes, a select-all header
 * checkbox, a risk badge derived from the score, and a destructive bulk
 * suspend that opens a confirm dialog before POSTing one suspend call per
 * selected user. next/navigation, sonner and fetch are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

import { FraudDetectionClient } from "@/components/admin/FraudDetectionClient";
import type { FraudSignal } from "@/app/(admin)/admin/fraud/page";

const mockRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
    info: vi.fn(),
  },
}));

function signal(over: Partial<FraudSignal>): FraudSignal {
  return {
    userId: "user-1",
    fullName: "Risky Rick",
    email: "rick@example.com",
    role: "agent",
    createdAt: "2026-05-01T00:00:00.000Z",
    isSuspended: false,
    reportCount: 4,
    riskScore: 90,
    ...over,
  };
}

const HIGH = signal({ userId: "user-high", fullName: "High Risk", riskScore: 90 });
const MED = signal({ userId: "user-med", fullName: "Med Risk", riskScore: 60 });
const SUSPENDED = signal({
  userId: "user-suspended",
  fullName: "Already Gone",
  riskScore: 95,
  isSuspended: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

describe("FraudDetectionClient", () => {
  it("renders a row per signal with names and the flagged count", () => {
    render(<FraudDetectionClient signals={[HIGH, MED]} />);
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("Med Risk")).toBeInTheDocument();
    expect(screen.getByText(/2 flagged users/i)).toBeInTheDocument();
  });

  it("derives High / Medium risk labels from the score", () => {
    render(<FraudDetectionClient signals={[HIGH, MED]} />);
    expect(screen.getByText(/High \(90\)/)).toBeInTheDocument();
    expect(screen.getByText(/Medium \(60\)/)).toBeInTheDocument();
  });

  it("keeps the bulk suspend button disabled until a row is selected", () => {
    render(<FraudDetectionClient signals={[HIGH]} />);
    const bulk = screen.getByRole("button", { name: /suspend selected/i });
    expect(bulk).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /select high risk/i }));
    expect(screen.getByRole("button", { name: /suspend selected \(1\)/i })).toBeEnabled();
  });

  it("select-all toggles every selectable row", () => {
    render(<FraudDetectionClient signals={[HIGH, MED]} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /select all/i }));
    expect(screen.getByText(/\(2 selected\)/i)).toBeInTheDocument();
  });

  it("disables the checkbox for an already-suspended user", () => {
    render(<FraudDetectionClient signals={[SUSPENDED]} />);
    // base-ui Checkbox exposes the disabled state via aria-disabled rather
    // than the native disabled attribute.
    expect(
      screen.getByRole("checkbox", { name: /select already gone/i }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("opens a confirm dialog before suspending and does not POST until confirmed", () => {
    render(<FraudDetectionClient signals={[HIGH]} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /select high risk/i }));
    fireEvent.click(screen.getByRole("button", { name: /suspend selected/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/confirm bulk suspension/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("POSTs one suspend call per selected user on confirm and toasts success", async () => {
    render(<FraudDetectionClient signals={[HIGH, MED]} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /select all/i }));
    fireEvent.click(screen.getByRole("button", { name: /suspend selected/i }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /suspend 2 users/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users/user-high/suspend",
      { method: "POST" },
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users/user-med/suspend",
      { method: "POST" },
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("2 users suspended"));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
