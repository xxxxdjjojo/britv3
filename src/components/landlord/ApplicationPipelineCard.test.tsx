import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationPipelineCard } from "./ApplicationPipelineCard";
import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";

// next/link is not needed beyond rendering an anchor; the component imports it
// but the default jsdom resolution renders fine for these assertions.

function makeApplication(
  overrides: Partial<TenantApplication> = {},
): TenantApplication {
  return {
    id: "app-1",
    property_id: "prop-1",
    landlord_id: "ll-1",
    applicant_user_id: "u-1",
    applicant_name: "Jordan Vance",
    applicant_email: "jordan@example.com",
    status: "received",
    monthly_income: 4200,
    employment_status: "Employed",
    credit_check_status: "passed",
    references_status: "verified",
    notes: null,
    rejection_reason: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

describe("ApplicationPipelineCard", () => {
  it("renders the styled badge for a known status", () => {
    render(<ApplicationPipelineCard application={makeApplication({ status: "approved" })} />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  // Regression for the role/enum-keyed crash class: `application.status` is a
  // live DB value cast to TenantApplicationStatus. A value outside the union
  // (migration adds a status, casing drift) must render a neutral fallback
  // badge, never throw on `statusStyle.bg` and white-screen the dashboard.
  it("does not crash on a status absent from STATUS_STYLES", () => {
    const application = makeApplication({
      status: "a_status_the_frontend_has_never_seen" as TenantApplicationStatus,
    });
    expect(() => render(<ApplicationPipelineCard application={application} />)).not.toThrow();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
