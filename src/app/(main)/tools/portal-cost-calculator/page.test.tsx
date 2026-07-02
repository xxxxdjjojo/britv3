import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureFlag } from "@/services/admin/feature-flag-service";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

const getFeatureFlags = vi.fn<() => Promise<FeatureFlag[]>>();
vi.mock("@/services/admin/feature-flag-service", () => ({
  getFeatureFlags: () => getFeatureFlags(),
}));

import PortalCostCalculatorPage, { metadata } from "./page";

function flag(key: string, enabled: boolean): FeatureFlag {
  return {
    key,
    enabled,
    rollout_pct: 0,
    allowed_roles: null,
    description: null,
    updated_at: "2026-07-02T00:00:00Z",
    updated_by: null,
  };
}

describe("Portal Cost Calculator page (flag-gated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports metadata", () => {
    expect(String(metadata.title)).toContain("Portal Cost Calculator");
  });

  it("404s when the portal_cost_calculator flag is absent", async () => {
    getFeatureFlags.mockResolvedValue([]);
    await expect(PortalCostCalculatorPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("404s when the flag exists but is disabled", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_calculator", false)]);
    await expect(PortalCostCalculatorPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("404s when only OTHER flags are enabled", async () => {
    getFeatureFlags.mockResolvedValue([flag("some_other_flag", true)]);
    await expect(PortalCostCalculatorPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the calculator when the flag is enabled", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_calculator", true)]);
    render(await PortalCostCalculatorPage());

    expect(notFound).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { level: 1, name: /Portal Cost Calculator/i }),
    ).toBeInTheDocument();
    // The estimate framing and legal caveats are on the page.
    expect(screen.getByText(/Our assumptions — edit them/i)).toBeInTheDocument();
    expect(
      screen.getByText(/estimate built from published averages/i),
    ).toBeInTheDocument();
    // Appears both as an inline SourcedFigure citation and in the sources list.
    expect(
      screen.getAllByText(/Rightmove plc FY2023 results/i).length,
    ).toBeGreaterThan(0);
  });
});
