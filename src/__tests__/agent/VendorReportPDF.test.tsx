/**
 * Test 11: VendorReportPDF renders without crash when initialReports = []
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { VendorReportPDF } from "@/components/dashboard/agent/sales/VendorReportPDF";

// Mock next/navigation used by sub-components that may be imported
vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue("/dashboard/agent/sales/reports"),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

describe("Test 11: VendorReportPDF", () => {
  it("renders without crashing when initialReports is empty array", () => {
    cleanup();
    // Should not throw
    expect(() => {
      render(<VendorReportPDF initialReports={[]} />);
    }).not.toThrow();
    cleanup();
  });

  it("shows 'No reports generated yet' when initialReports is empty", () => {
    render(<VendorReportPDF initialReports={[]} />);
    expect(
      screen.getByText(/No reports generated yet/i),
    ).toBeDefined();
    cleanup();
  });

  it("shows 'Generate New Report' heading", () => {
    render(<VendorReportPDF initialReports={[]} />);
    expect(screen.getByText("Generate New Report")).toBeDefined();
    cleanup();
  });

  it("shows Previous Reports count as 0", () => {
    render(<VendorReportPDF initialReports={[]} />);
    // "Previous Reports (0)" is split across text nodes — use getAllByText with function matcher
    const heading = screen.getByRole("heading", {
      name: (name) => name.includes("Previous Reports"),
    });
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain("0");
    cleanup();
  });
});
