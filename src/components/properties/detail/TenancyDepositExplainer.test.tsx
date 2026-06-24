// Render tests for the rent tenancy & deposit explainer (server-style pure component).
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenancyDepositExplainer } from "./TenancyDepositExplainer";

describe("TenancyDepositExplainer", () => {
  it("shows the within-cap line and scheme line for a compliant deposit", () => {
    // 1850 pcm => 5-week cap ≈ £2,135; deposit £2,135 is within cap.
    render(
      <TenancyDepositExplainer
        monthlyRent={1850}
        depositAmount={2135}
        depositScheme="DPS"
        availableFrom="2026-03-01"
        minimumTenancyMonths={12}
        maximumTenancyMonths={null}
      />,
    );

    expect(screen.getByText(/within the Tenant Fees Act/i)).toBeTruthy();
    expect(screen.getByText(/government-approved scheme/i)).toBeTruthy();
    expect(screen.getByText("DPS")).toBeTruthy();
    expect(screen.getByText(/Minimum tenancy 12 months/i)).toBeTruthy();
  });

  it("shows the above-cap caution for an over-cap deposit", () => {
    // 1250 pcm => 5-week cap ≈ £1,442; deposit £1,800 exceeds it.
    render(
      <TenancyDepositExplainer
        monthlyRent={1250}
        depositAmount={1800}
        depositScheme={null}
        availableFrom={null}
        minimumTenancyMonths={null}
        maximumTenancyMonths={null}
      />,
    );

    expect(screen.getByText(/above the Tenant Fees Act/i)).toBeTruthy();
  });

  it("renders nothing when no block has data", () => {
    const { container } = render(
      <TenancyDepositExplainer
        monthlyRent={1500}
        depositAmount={null}
        depositScheme={null}
        availableFrom={null}
        minimumTenancyMonths={null}
        maximumTenancyMonths={null}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
