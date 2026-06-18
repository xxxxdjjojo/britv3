import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VendorReportsPage } from "@/components/dashboard/agent/sales/VendorReportsPage";
import { VENDOR_LISTINGS, makeVendorReport } from "./fixtures";

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.restoreAllMocks();
});

describe("VendorReportsPage — render with data", () => {
  it("renders the generator card and the report list heading with count", () => {
    render(
      <VendorReportsPage
        listings={VENDOR_LISTINGS}
        initialReports={[makeVendorReport(), makeVendorReport({ id: "rep-2" })]}
      />,
    );
    expect(screen.getByText("Generate New Report")).toBeInTheDocument();
    expect(screen.getByText(/Generated Reports/)).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("renders each report with its property label and type badge", () => {
    render(
      <VendorReportsPage
        listings={VENDOR_LISTINGS}
        initialReports={[
          makeVendorReport({ property_id: "vl-1", report_type: "market_analysis" }),
        ]}
      />,
    );
    // property label resolved from the listings prop
    expect(screen.getByText("12 Report Road, Leeds")).toBeInTheDocument();
    expect(screen.getByText("Market Analysis")).toBeInTheDocument();
  });

  it("falls back to a truncated property id when the listing is unknown", () => {
    render(
      <VendorReportsPage
        listings={VENDOR_LISTINGS}
        initialReports={[
          makeVendorReport({ property_id: "zzzzzzzz-9999-0000-0000-000000000000" }),
        ]}
      />,
    );
    expect(screen.getByText("zzzzzzzz...")).toBeInTheDocument();
  });
});

describe("VendorReportsPage — empty states", () => {
  it("shows the no-reports message when there are no reports", () => {
    render(<VendorReportsPage listings={VENDOR_LISTINGS} initialReports={[]} />);
    expect(screen.getByText("No reports generated yet.")).toBeInTheDocument();
    expect(screen.getByText("(0)")).toBeInTheDocument();
  });

  it("shows the no-listings message and hides the generator form when there are no listings", () => {
    render(<VendorReportsPage listings={[]} initialReports={[]} />);
    expect(
      screen.getByText(
        "No active listings found. Create a listing to generate vendor reports.",
      ),
    ).toBeInTheDocument();
    // The Generate Report button is not rendered without listings.
    expect(
      screen.queryByRole("button", { name: /Generate Report/ }),
    ).not.toBeInTheDocument();
  });
});

describe("VendorReportsPage — generate action", () => {
  it("disables the Generate button until a property is selected", () => {
    render(<VendorReportsPage listings={VENDOR_LISTINGS} initialReports={[]} />);
    // selectedPropertyId starts empty, so the button is disabled.
    expect(
      screen.getByRole("button", { name: /Generate Report/ }),
    ).toBeDisabled();
  });

  // FINDING: selecting a property requires committing a Radix Select value,
  // which does not work under happy-dom (onValueChange never fires). The happy
  // path of handleGenerate (POST /api/agent/reports → prepend report → success
  // toast) cannot be reached through the UI here because the button stays
  // disabled without a selection. Needs jsdom+user-event or a way to seed the
  // selected property. Not faked.
  it.todo("POSTs to /api/agent/reports and prepends the new report on success");
  it.todo("shows an error toast when report generation fails");
});
