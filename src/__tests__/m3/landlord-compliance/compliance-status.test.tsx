// M3-A1 — Landlord compliance: status categorisation + countdown + tiles + banners.
// Presentational components rendered with fixture props (most deterministic).
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ComplianceCountdownBadge,
  getCountdownVariant,
} from "@/components/landlord/ComplianceCountdownBadge";
import CertificateStatusTile from "@/components/landlord/CertificateStatusTile";
import { ComplianceAlertBanner } from "@/components/landlord/ComplianceAlertBanner";
import { AllClearBanner } from "@/components/landlord/AllClearBanner";

describe("getCountdownVariant — status categorisation", () => {
  it("categorises a past/zero day count as expired", () => {
    expect(getCountdownVariant(0)).toBe("expired");
    expect(getCountdownVariant(-5)).toBe("expired");
  });

  it("categorises <=7 days as critical", () => {
    expect(getCountdownVariant(1)).toBe("critical");
    expect(getCountdownVariant(7)).toBe("critical");
  });

  it("categorises 8-30 days as warning", () => {
    expect(getCountdownVariant(8)).toBe("warning");
    expect(getCountdownVariant(30)).toBe("warning");
  });

  it("categorises >30 days as safe", () => {
    expect(getCountdownVariant(31)).toBe("safe");
    expect(getCountdownVariant(365)).toBe("safe");
  });
});

describe("ComplianceCountdownBadge", () => {
  it("renders EXPIRED label when days are non-positive", () => {
    render(<ComplianceCountdownBadge daysUntilExpiry={-2} />);
    expect(screen.getByText("EXPIRED")).toBeInTheDocument();
  });

  it("renders the day count for a future expiry", () => {
    render(<ComplianceCountdownBadge daysUntilExpiry={14} />);
    expect(screen.getByText("14d")).toBeInTheDocument();
  });

  it("applies the warning style class for a 30-day window", () => {
    render(<ComplianceCountdownBadge daysUntilExpiry={20} />);
    const badge = screen.getByText("20d");
    expect(badge.className).toContain("text-amber-700");
  });
});

describe("CertificateStatusTile — valid/expiring/expired categorisation", () => {
  it("shows the 'expired' pill and red border when any expired", () => {
    render(
      <CertificateStatusTile
        category="gas_safety"
        totalProperties={3}
        expired={2}
        expiringSoon={1}
        valid={0}
      />,
    );
    expect(screen.getByText("2 expired")).toBeInTheDocument();
    // Expired takes priority over expiring-soon in the pill.
    expect(screen.queryByText("1 expiring soon")).not.toBeInTheDocument();
  });

  it("shows the 'expiring soon' pill when none expired but some expiring", () => {
    render(
      <CertificateStatusTile
        category="electrical_eicr"
        totalProperties={2}
        expired={0}
        expiringSoon={3}
        valid={1}
      />,
    );
    expect(screen.getByText("3 expiring soon")).toBeInTheDocument();
  });

  it("shows 'All compliant' when nothing expired or expiring", () => {
    render(
      <CertificateStatusTile
        category="epc"
        totalProperties={1}
        expired={0}
        expiringSoon={0}
        valid={4}
      />,
    );
    expect(screen.getByText("All compliant")).toBeInTheDocument();
  });

  it("renders the category label and pluralised property footer", () => {
    render(
      <CertificateStatusTile
        category="gas_safety"
        totalProperties={3}
        expired={0}
        expiringSoon={0}
        valid={3}
      />,
    );
    expect(screen.getByText("Gas Safety")).toBeInTheDocument();
    expect(screen.getByText("3 properties in portfolio")).toBeInTheDocument();
  });

  it("renders nothing for an unknown category", () => {
    const { container } = render(
      <CertificateStatusTile
        // @ts-expect-error — exercising the unknown-category guard branch.
        category="not_a_category"
        totalProperties={1}
        expired={0}
        expiringSoon={0}
        valid={0}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("links to the alerts page filtered by category", () => {
    render(
      <CertificateStatusTile
        category="epc"
        totalProperties={1}
        expired={0}
        expiringSoon={0}
        valid={1}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/landlord/compliance/alerts?category=epc",
    );
  });
});

describe("ComplianceAlertBanner — expiry alert rendering", () => {
  it("renders an 'Expired on' message and Fix Now CTA when overdue", () => {
    render(
      <ComplianceAlertBanner
        type="gas_safety"
        propertyAddress="42 Baker Street"
        expiryDate="2026-01-01"
        daysUntilExpiry={-10}
      />,
    );
    expect(screen.getByText("Gas Safety Certificate")).toBeInTheDocument();
    expect(screen.getByText(/Expired on/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fix Now" })).toBeInTheDocument();
  });

  it("renders a 'Due in N days' message when not yet expired", () => {
    render(
      <ComplianceAlertBanner
        type="epc"
        propertyAddress="42 Baker Street"
        expiryDate="2026-12-01"
        daysUntilExpiry={5}
      />,
    );
    expect(screen.getByText("EPC Certificate")).toBeInTheDocument();
    expect(screen.getByText("Due in 5 days")).toBeInTheDocument();
  });

  it("singularises the day label for a 1-day window", () => {
    render(
      <ComplianceAlertBanner
        type="electrical_eicr"
        propertyAddress="42 Baker Street"
        expiryDate="2026-12-01"
        daysUntilExpiry={1}
      />,
    );
    expect(screen.getByText("Due in 1 day")).toBeInTheDocument();
  });

  it("falls back to the raw type when not in the label map", () => {
    render(
      <ComplianceAlertBanner
        type="custom_cert"
        propertyAddress="1 Test Road"
        expiryDate="2026-12-01"
        daysUntilExpiry={3}
      />,
    );
    expect(screen.getByText("custom_cert")).toBeInTheDocument();
  });
});

describe("AllClearBanner", () => {
  it("renders the on-track message", () => {
    render(<AllClearBanner monthlyCashflow={0} />);
    expect(screen.getByText("Everything's on track")).toBeInTheDocument();
  });

  it("shows formatted cashflow only when positive", () => {
    const { rerender } = render(<AllClearBanner monthlyCashflow={1200} />);
    expect(screen.getByText(/Monthly cashflow: £1,200/)).toBeInTheDocument();

    rerender(<AllClearBanner monthlyCashflow={0} />);
    expect(screen.queryByText(/Monthly cashflow/)).not.toBeInTheDocument();
  });
});
