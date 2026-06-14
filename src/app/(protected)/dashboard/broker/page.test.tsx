import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BrokerDashboardPage from "./page";

describe("BrokerDashboardPage", () => {
  it("renders the main heading", () => {
    render(<BrokerDashboardPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /mortgage broker dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders the Pipeline Distribution section", () => {
    render(<BrokerDashboardPage />);
    expect(
      screen.getByRole("heading", { name: /pipeline distribution/i }),
    ).toBeInTheDocument();
  });

  it("renders the Market Intelligence panel", () => {
    render(<BrokerDashboardPage />);
    expect(
      screen.getByRole("heading", { name: /market intelligence/i }),
    ).toBeInTheDocument();
  });
});
