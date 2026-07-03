import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

vi.mock("@/services/metrics/platform-metrics-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getMetricsPageData: vi.fn(),
}));

import {
  buildSeries,
  getMetricsPageData,
  type MetricsPageData,
  type MetricSnapshot,
} from "@/services/metrics/platform-metrics-service";

import OpenMetricsPage from "./page";

const mockGet = vi.mocked(getMetricsPageData);

function snapshot(key: MetricSnapshot["key"], value: number): MetricSnapshot {
  return {
    key,
    latestValue: value,
    latestDay: "2026-07-02",
    sinceDay: "2026-06-20",
    series: buildSeries(
      [
        { day: "2026-07-01", value: value - 1 },
        { day: "2026-07-02", value },
      ],
      { end: "2026-07-02" },
    ),
    meta: {},
  };
}

/** All gates closed: fresh platform, no probes, suppressed time-to-sell. */
function gatedData(): MetricsPageData {
  return {
    metrics: {
      active_sale_listings: snapshot("active_sale_listings", 14),
      registered_users: snapshot("registered_users", 251),
    },
    uptime: { probeCount: 12, okCount: 12, availabilityPct: null },
    latestUptimeCheck: { ok: true, checkedAt: "2026-07-02T09:00:00Z", latencyMs: 180 },
    timeToSell: { period: "2026-Q3", medianDays: null, sampleN: 3, suppressed: true },
  };
}

/** All gates open. */
function openData(): MetricsPageData {
  const resolved = snapshot("content_reports_resolved", 25);
  resolved.meta = { median_resolution_hours: 6.5, resolved_sample_n: 25 };
  return {
    metrics: {
      active_sale_listings: snapshot("active_sale_listings", 14),
      content_reports_resolved: resolved,
    },
    uptime: { probeCount: 2880, okCount: 2875, availabilityPct: 99.83 },
    latestUptimeCheck: { ok: true, checkedAt: "2026-07-02T09:00:00Z", latencyMs: 120 },
    timeToSell: { period: "2026-Q3", medianDays: 84, sampleN: 22, suppressed: false },
  };
}

describe("Open metrics page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hero and each metric card with its value and verbatim definition", async () => {
    mockGet.mockResolvedValue(gatedData());
    render(await OpenMetricsPage());

    expect(
      screen.getByRole("heading", { name: /our numbers, in the open/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("251")).toBeInTheDocument();
    expect(
      screen.getByText(/listings with listing_type 'sale', status 'active' and not deleted/i),
    ).toBeInTheDocument();
  });

  it("shows an honest awaiting state for metrics with no snapshot (never a fake 0)", async () => {
    mockGet.mockResolvedValue(gatedData());
    render(await OpenMetricsPage());

    // messages_30d has no snapshot in the fixture.
    const awaiting = screen.getAllByText(/awaiting the first nightly snapshot/i);
    expect(awaiting.length).toBeGreaterThan(0);
  });

  it("renders gated states with each gate disclosed", async () => {
    mockGet.mockResolvedValue(gatedData());
    render(await OpenMetricsPage());

    // Uptime: gate (100 probes) + current probe count + live status.
    expect(screen.getByText(/at least 100 probes exist \(currently 12\)/i)).toBeInTheDocument();
    expect(screen.getByText(/up as of the last probe/i)).toBeInTheDocument();
    // Time-to-sell: coming-soon copy + sample count.
    expect(
      screen.getByText(/coming soon — arrives with matched-sale coverage/i),
    ).toBeInTheDocument();
    // Resolution median: not enough data.
    expect(
      screen.getByText(/at least 10 reports have been resolved\. no number is better/i),
    ).toBeInTheDocument();
  });

  it("renders real figures once the gates clear", async () => {
    mockGet.mockResolvedValue(openData());
    render(await OpenMetricsPage());

    expect(screen.getByText(/99\.83/)).toBeInTheDocument();
    expect(screen.getByText(/84/)).toBeInTheDocument();
    expect(screen.getByText(/6\.5 hrs/)).toBeInTheDocument();
  });

  it("displays the definitions version line and links to /pledges", async () => {
    mockGet.mockResolvedValue(gatedData());
    render(await OpenMetricsPage());

    expect(
      screen.getByRole("heading", { name: /definitions v1/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/never a silent\s*redefinition/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /our public pledges/i })).toHaveAttribute(
      "href",
      "/pledges",
    );
  });
});
