/**
 * M3-A9 — FeatureFlagsClient (toggle switch + rollout slider + save).
 *
 * Each flag row owns a Switch (toggle POST) and a Slider whose change reveals
 * a Save button that POSTs the new rollout pct. next/navigation, sonner and
 * fetch are mocked. The Slider is a base-ui component; rather than simulate a
 * drag (unreliable in happy-dom) we assert the slider renders and the Save
 * affordance only appears when the value is dirtied — see the it.todo below
 * for the drag-driven path.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { FeatureFlagsClient } from "@/components/admin/FeatureFlagsClient";
import type { FeatureFlag } from "@/services/admin/feature-flag-service";

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

function flag(over: Partial<FeatureFlag>): FeatureFlag {
  return {
    key: "search_live_data",
    enabled: false,
    rollout_pct: 0,
    allowed_roles: ["admin"],
    description: "Use live property data on the public site",
    updated_at: "2026-06-01T12:00:00.000Z",
    updated_by: "admin-1",
    ...over,
  };
}

const FLAG_OFF = flag({ key: "search_live_data", enabled: false, rollout_pct: 25 });
const FLAG_ON = flag({ key: "sellers_default_tier", enabled: true, rollout_pct: 100 });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});

describe("FeatureFlagsClient", () => {
  it("renders each flag key, its rollout pct and the summary counts", () => {
    render(<FeatureFlagsClient flags={[FLAG_OFF, FLAG_ON]} />);
    expect(screen.getByText("search_live_data")).toBeInTheDocument();
    expect(screen.getByText("sellers_default_tier")).toBeInTheDocument();
    expect(screen.getByText(/2 flags/i)).toBeInTheDocument();
    expect(screen.getByText(/1 enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/rollout: 25%/i)).toBeInTheDocument();
  });

  it("renders allowed-role badges and the description", () => {
    render(<FeatureFlagsClient flags={[FLAG_OFF]} />);
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(
      screen.getByText(/use live property data on the public site/i),
    ).toBeInTheDocument();
  });

  it("renders an empty flag list without crashing (0 flags / 0 enabled)", () => {
    render(<FeatureFlagsClient flags={[]} />);
    expect(screen.getByText(/0 flags/i)).toBeInTheDocument();
    expect(screen.getByText(/0 enabled/i)).toBeInTheDocument();
  });

  it("toggles a flag on via POST and refreshes", async () => {
    render(<FeatureFlagsClient flags={[FLAG_OFF]} />);
    const sw = screen.getByRole("switch", { name: /toggle search_live_data/i });
    fireEvent.click(sw);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/feature-flags/search_live_data/toggle",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ enabled: true }),
        }),
      ),
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("toggles an enabled flag off via POST", async () => {
    render(<FeatureFlagsClient flags={[FLAG_ON]} />);
    fireEvent.click(screen.getByRole("switch", { name: /toggle sellers_default_tier/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/feature-flags/sellers_default_tier/toggle",
        expect.objectContaining({ body: JSON.stringify({ enabled: false }) }),
      ),
    );
  });

  it("shows a toast.error and does not refresh when the toggle POST fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Flag is locked" }),
      }),
    );
    render(<FeatureFlagsClient flags={[FLAG_OFF]} />);
    fireEvent.click(screen.getByRole("switch", { name: /toggle search_live_data/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Flag is locked"));
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("hides the rollout Save button until the slider value is dirtied", () => {
    render(<FeatureFlagsClient flags={[FLAG_OFF]} />);
    // No pending change yet, so no Save affordance.
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
    // The rollout control reflects the flag's current pct.
    expect(screen.getByText(/rollout: 25%/i)).toBeInTheDocument();
  });

  // FINDING: base-ui Slider drag does not fire onValueChange reliably under
  // happy-dom (no real pointer geometry), so the "dirty slider -> Save ->
  // POST /rollout" path can't be deterministically simulated at the unit
  // level. Covered by E2E instead.
  it.todo("saves a dirtied rollout pct via POST /rollout when the slider is dragged");
});
