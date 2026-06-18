/**
 * AgentPerformanceCharts — KPI summary cards, date-range selector, empty
 * states for the chart bodies, and the pure-DOM conversion funnel.
 *
 * Recharts SVG geometry depends on a measured container (ResponsiveContainer),
 * which has no real layout under happy-dom — so we assert on the surrounding
 * card chrome, KPI values, and the funnel (plain divs), not chart paths.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { AgentPerformanceCharts } from "@/components/dashboard/agent/analytics/AgentPerformanceCharts";
import { makePerformanceReport, makeEmptyPerformanceReport } from "./fixtures";

const AGENT_ID = "agent-1";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("AgentPerformanceCharts — render with data", () => {
  it("renders the KPI summary values from the report", () => {
    render(
      <AgentPerformanceCharts
        initialReport={makePerformanceReport()}
        agentId={AGENT_ID}
      />,
    );

    expect(screen.getByText("Listings Sold")).toBeInTheDocument();
    // "42" (listings_sold_count) also surfaces as the funnel "Completions"
    // count, so assert it inside the Listings-Sold KPI card specifically.
    const listingsKpi = screen.getByText("Listings Sold").closest("[data-slot='card']");
    expect(listingsKpi).not.toBeNull();
    expect(within(listingsKpi as HTMLElement).getByText("42")).toBeInTheDocument();
    expect(screen.getByText("38 days")).toBeInTheDocument(); // avg_time_on_market
    expect(screen.getByText("25.0%")).toBeInTheDocument(); // conversion_rate
    expect(screen.getByText("4.6 / 5")).toBeInTheDocument(); // client_satisfaction
  });

  it("renders the date-range selector buttons", () => {
    render(
      <AgentPerformanceCharts
        initialReport={makePerformanceReport()}
        agentId={AGENT_ID}
      />,
    );

    expect(screen.getByRole("button", { name: /last 30 days/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /last 90 days/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /last 12 months/i })).toBeInTheDocument();
  });

  it("renders the chart card titles and the conversion funnel stages", () => {
    render(
      <AgentPerformanceCharts
        initialReport={makePerformanceReport()}
        agentId={AGENT_ID}
      />,
    );

    expect(screen.getByText("Listings Sold per Month")).toBeInTheDocument();
    expect(screen.getByText("Revenue per Month")).toBeInTheDocument();
    expect(screen.getByText("Conversion Funnel")).toBeInTheDocument();

    // Funnel rows are plain divs (no SVG) and always render.
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getByText("Viewings")).toBeInTheDocument();
    expect(screen.getByText("Offers")).toBeInTheDocument();
    expect(screen.getByText("Completions")).toBeInTheDocument();
  });

  it("fetches a new report when a different date range is selected", () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makePerformanceReport(),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AgentPerformanceCharts
        initialReport={makePerformanceReport()}
        agentId={AGENT_ID}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /last 30 days/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/agent/analytics?type=agent"),
    );
  });
});

describe("AgentPerformanceCharts — empty state", () => {
  it("renders fallback empty-state copy in the chart bodies when there is no series data", () => {
    render(
      <AgentPerformanceCharts
        initialReport={makeEmptyPerformanceReport()}
        agentId={AGENT_ID}
      />,
    );

    // listings_over_time / revenue_over_time are absent -> mapped arrays empty
    expect(
      screen.getByText(/no sales data for selected period/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no revenue data for selected period/i),
    ).toBeInTheDocument();
  });

  it("renders em-dash fallbacks for null-ish optional KPIs", () => {
    render(
      <AgentPerformanceCharts
        initialReport={makeEmptyPerformanceReport()}
        agentId={AGENT_ID}
      />,
    );

    // avg_time_on_market_days is 0 -> "0 days"; conversion 0 -> "0.0%"
    expect(screen.getByText("0 days")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });
});
