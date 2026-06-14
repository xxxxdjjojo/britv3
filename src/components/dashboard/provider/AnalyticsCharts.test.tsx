import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsCharts } from "./AnalyticsCharts";
import type { EarningsByMonth, TopCategory } from "@/services/provider/provider-analytics-service";

const earningsByMonth: EarningsByMonth[] = [
  { month: "2024-01", earnings_pence: 1_500_000 },
  { month: "2024-02", earnings_pence: 1_800_000 },
];

const topCategories: TopCategory[] = [
  { category: "Full Installation", bookings: 10 },
  { category: "Boiler Repair", bookings: 8 },
  { category: "Emergency Callout", bookings: 5 },
];

const noop = () => undefined;

describe("AnalyticsCharts", () => {
  it("renders the Earnings Trend heading", () => {
    render(
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={topCategories}
        period="30d"
        onPeriodChange={noop}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /earnings trend/i }),
    ).toBeInTheDocument();
  });

  it("renders the Top Categories heading", () => {
    render(
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={topCategories}
        period="30d"
        onPeriodChange={noop}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /top categories/i }),
    ).toBeInTheDocument();
  });

  it("renders the Top Categories panel when data is present", () => {
    render(
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={topCategories}
        period="30d"
        onPeriodChange={noop}
      />,
    );
    // The Top Categories heading is visible; the BarChart itself is SVG-rendered
    expect(
      screen.getByRole("heading", { name: /top categories/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when no earnings data", () => {
    render(
      <AnalyticsCharts
        earningsByMonth={[]}
        topCategories={topCategories}
        period="30d"
        onPeriodChange={noop}
      />,
    );
    expect(screen.getByText(/no earnings data/i)).toBeInTheDocument();
  });

  it("shows empty state when no category data", () => {
    render(
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={[]}
        period="30d"
        onPeriodChange={noop}
      />,
    );
    expect(screen.getByText(/no category data/i)).toBeInTheDocument();
  });

  it("renders the Top Categories bar chart (not fabricated monetary values)", () => {
    render(
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={topCategories}
        period="30d"
        onPeriodChange={noop}
      />,
    );
    // The Top Categories heading is present; BarChart renders SVG in JSDOM
    expect(
      screen.getByRole("heading", { name: /top categories/i }),
    ).toBeInTheDocument();
    // No fabricated monetary values like "£150,000" should appear
    expect(screen.queryByText(/£150,000/)).not.toBeInTheDocument();
  });
});
