import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ListingAnalyticsPage from "./page";

describe("ListingAnalyticsPage", () => {
  it("renders the editorial page heading", () => {
    render(<ListingAnalyticsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /listing analytics/i }),
    ).toBeInTheDocument();
  });

  it("renders the KPI stat tiles", () => {
    render(<ListingAnalyticsPage />);
    expect(screen.getByText("Total Views")).toBeInTheDocument();
    expect(screen.getByText("12,482")).toBeInTheDocument();
    expect(screen.getByText("Enquiries")).toBeInTheDocument();
  });

  it("renders the engagement trend charts", () => {
    render(<ListingAnalyticsPage />);
    expect(
      screen.getByRole("heading", { name: /engagement trends/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /views over time trend/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /enquiries over time trend/i }),
    ).toBeInTheDocument();
  });

  it("renders the lead distribution breakdown and recent activity table", () => {
    render(<ListingAnalyticsPage />);
    expect(
      screen.getByRole("heading", { name: /lead distribution/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent viewing activity/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Property Search").length).toBeGreaterThan(0);
  });
});
