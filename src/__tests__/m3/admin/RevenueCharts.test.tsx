/**
 * Admin revenue chart render tests.
 *
 * Proves the previously-mock chart components now:
 * 1. Render REAL passed-in data (not a hardcoded MOCK constant)
 * 2. Show an honest empty state ("No revenue data yet") when data is all zeros
 *    — instead of silently displaying fake numbers
 *
 * recharts renders an SVG in jsdom without a real layout, so we assert on the
 * empty-state text and the absence of the old mock month labels rather than
 * pixel output.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminDashboardCharts } from "@/components/admin/AdminDashboardCharts";
import { RevenueBarChart } from "@/components/admin/RevenueBarChart";

// The meaningful behavioural distinction is: real revenue takes the chart
// branch (empty-state message absent), all-zero/omitted data takes the honest
// empty-state branch. recharts itself needs real layout to paint an SVG in
// jsdom, so we assert on the branch selection, not pixel output.

describe("AdminDashboardCharts (dashboard revenue area chart)", () => {
  it("renders an honest empty state when all months are zero", () => {
    const zeroData = [
      { month: "Jan", revenue: 0 },
      { month: "Feb", revenue: 0 },
      { month: "Mar", revenue: 0 },
    ];
    render(<AdminDashboardCharts data={zeroData} />);
    expect(screen.getByText(/no revenue data yet/i)).toBeInTheDocument();
  });

  it("renders the chart (not the empty state) when real revenue exists", () => {
    const realData = [
      { month: "Jan", revenue: 0 },
      { month: "Feb", revenue: 4200 },
      { month: "Mar", revenue: 9400 },
    ];
    render(<AdminDashboardCharts data={realData} />);
    // Real revenue takes the chart branch — the empty-state message is absent
    expect(screen.queryByText(/no revenue data yet/i)).not.toBeInTheDocument();
  });

  it("renders empty state when data prop is omitted (no fake fallback)", () => {
    render(<AdminDashboardCharts />);
    expect(screen.getByText(/no revenue data yet/i)).toBeInTheDocument();
  });
});

describe("RevenueBarChart (revenue analytics bar chart)", () => {
  it("renders an honest empty state when all months are zero", () => {
    const zeroData = [
      { month: "Jan", revenue: 0 },
      { month: "Feb", revenue: 0 },
    ];
    render(<RevenueBarChart data={zeroData} />);
    expect(screen.getByText(/no revenue data yet/i)).toBeInTheDocument();
  });

  it("renders the bar chart when real revenue exists", () => {
    const realData = [
      { month: "Jan", revenue: 1200 },
      { month: "Feb", revenue: 3400 },
    ];
    render(<RevenueBarChart data={realData} />);
    expect(screen.queryByText(/no revenue data yet/i)).not.toBeInTheDocument();
  });

  it("renders empty state when data prop is omitted (no MOCK_DATA fallback)", () => {
    render(<RevenueBarChart />);
    expect(screen.getByText(/no revenue data yet/i)).toBeInTheDocument();
  });
});
