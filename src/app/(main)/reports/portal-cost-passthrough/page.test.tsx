import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureFlag } from "@/services/admin/feature-flag-service";
import { PASSTHROUGH_STUDY_MIN_N } from "@/content/passthrough-study/results";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

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

import PortalCostPassthroughMethodologyPage, {
  metadata as methodologyMetadata,
} from "./methodology/page";
import PortalCostPassthroughPage, { metadata } from "./page";

function flag(key: string, enabled: boolean): FeatureFlag {
  return {
    key,
    enabled,
    rollout_pct: 0,
    allowed_roles: null,
    description: null,
    updated_at: "2026-07-03T00:00:00Z",
    updated_by: null,
  };
}

function pageProps(searchParams: { preview?: string } = {}) {
  return { searchParams: Promise.resolve(searchParams) };
}

describe("Portal Cost Passthrough Study page (flag-gated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports metadata", () => {
    expect(String(metadata.title)).toContain("Portal Cost Passthrough");
  });

  it("404s when the portal_cost_passthrough flag is absent", async () => {
    getFeatureFlags.mockResolvedValue([]);
    await expect(PortalCostPassthroughPage(pageProps())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("404s when the flag exists but is disabled", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", false)]);
    await expect(PortalCostPassthroughPage(pageProps())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("404s when only OTHER flags are enabled", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_calculator", true)]);
    await expect(PortalCostPassthroughPage(pageProps())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders the report when the flag is enabled", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", true)]);
    render(await PortalCostPassthroughPage(pageProps()));

    expect(notFound).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Portal Cost Passthrough Study/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the honest fieldwork-in-progress state (findings file ships empty)", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", true)]);
    render(await PortalCostPassthroughPage(pageProps()));

    expect(
      screen.getByText(/Fieldwork in progress — no findings published yet/i),
    ).toBeInTheDocument();
    // The survey design is disclosed up front.
    expect(screen.getByText(/The research question:/i)).toBeInTheDocument();
    expect(screen.getByText(/The method:/i)).toBeInTheDocument();
  });

  it("sources every published figure and uses alleges language for the CAT claim", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", true)]);
    render(await PortalCostPassthroughPage(pageProps()));

    // ARPA figure carries its inline citation.
    expect(screen.getByText("£1,431")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Rightmove plc FY2023 results/i).length,
    ).toBeGreaterThan(0);
    // CAT litigation figure is framed as an allegation, never a finding.
    expect(screen.getByText(/the claim alleges/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rightmove denies/i).length).toBeGreaterThan(0);
  });

  it("emits Dataset JSON-LD", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", true)]);
    const { container } = render(await PortalCostPassthroughPage(pageProps()));

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const jsonLd = JSON.parse(script?.textContent ?? "{}") as {
      "@type"?: string;
      creator?: { name?: string };
    };
    expect(jsonLd["@type"]).toBe("Dataset");
    expect(jsonLd.creator?.name).toBe("TrueDeed");
  });
});

describe("Portal Cost Passthrough methodology page (flag-gated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports metadata", () => {
    expect(String(methodologyMetadata.title)).toContain("methodology");
  });

  it("404s when the flag is off", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", false)]);
    await expect(PortalCostPassthroughMethodologyPage()).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders sources, the disclosed threshold, and the version when the flag is on", async () => {
    getFeatureFlags.mockResolvedValue([flag("portal_cost_passthrough", true)]);
    render(await PortalCostPassthroughMethodologyPage());

    expect(notFound).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { level: 1, name: /methodology/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(new RegExp(`${PASSTHROUGH_STUDY_MIN_N} responses`, "i")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/alleg/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/v1/)).toBeInTheDocument();
  });
});
