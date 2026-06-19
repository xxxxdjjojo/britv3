import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IncomeExpenseReportClient } from "@/app/(protected)/dashboard/landlord/finance/report/IncomeExpenseReportClient";
import type {
  MonthlyDataPoint,
  CategoryDataPoint,
} from "@/components/landlord/IncomeExpenseChart";

// Recharts ResponsiveContainer measures layout, which happy-dom can't do.
// Mock the chart components to deterministic stubs that surface their data
// so we can assert the report wires the data through without flakiness.
vi.mock("@/components/landlord/IncomeExpenseChart", () => ({
  IncomeExpenseTrendChart: ({ data }: { data: MonthlyDataPoint[] }) => (
    <div data-testid="trend-chart">trend:{data.length}</div>
  ),
  ExpenseCategoryChart: ({ data }: { data: CategoryDataPoint[] }) => (
    <div data-testid="category-chart">category:{data.length}</div>
  ),
}));

const MONTHLY: MonthlyDataPoint[] = [
  { month: "Jan 2026", income: 1500, expenses: 300, net: 1200 },
  { month: "Feb 2026", income: 1500, expenses: 500, net: 1000 },
];

const CATEGORIES: CategoryDataPoint[] = [
  { category: "Maintenance", amount: 400 },
  { category: "Insurance", amount: 400 },
];

// FINDING: The live /dashboard/landlord/finance/report PAGE (page.tsx data layer)
// errors with "column properties_1.address_line_1 does not exist" when querying
// Supabase. That is a data-layer/query bug, not a component bug. These tests feed
// the presentational client fixture props directly, which is the intended usage
// and sidesteps the broken query. The query bug is out of scope here.

describe("IncomeExpenseReportClient", () => {
  it("renders both charts when data is present", () => {
    render(<IncomeExpenseReportClient monthlyData={MONTHLY} categoryData={CATEGORIES} />);
    expect(screen.getByTestId("trend-chart")).toHaveTextContent("trend:2");
    expect(screen.getByTestId("category-chart")).toHaveTextContent("category:2");
  });

  it("shows trend empty state when all months are zero", () => {
    const empty: MonthlyDataPoint[] = [
      { month: "Jan 2026", income: 0, expenses: 0, net: 0 },
      { month: "Feb 2026", income: 0, expenses: 0, net: 0 },
    ];
    render(<IncomeExpenseReportClient monthlyData={empty} categoryData={[]} />);
    expect(
      screen.getByText("No financial data for the last 12 months."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("trend-chart")).not.toBeInTheDocument();
  });

  it("shows category empty state when there is no expense data", () => {
    render(<IncomeExpenseReportClient monthlyData={MONTHLY} categoryData={[]} />);
    expect(screen.getByText("No expense data yet.")).toBeInTheDocument();
    expect(screen.queryByTestId("category-chart")).not.toBeInTheDocument();
  });

  describe("CSV export", () => {
    beforeEach(() => {
      // happy-dom lacks URL.createObjectURL — stub the download plumbing.
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: vi.fn(() => "blob:mock"),
        revokeObjectURL: vi.fn(),
      });
    });

    it("builds a CSV blob from the monthly data on export click", () => {
      const clickSpy = vi.fn();
      const realCreate = document.createElement.bind(document);
      const createSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tag: string) => {
          const el = realCreate(tag);
          if (tag === "a") {
            // Intercept the click so jsdom/happy-dom doesn't navigate.
            Object.defineProperty(el, "click", { value: clickSpy });
          }
          return el;
        });

      render(<IncomeExpenseReportClient monthlyData={MONTHLY} categoryData={CATEGORIES} />);
      fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = (URL.createObjectURL as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe("text/csv");
      expect(clickSpy).toHaveBeenCalledTimes(1);

      createSpy.mockRestore();
    });
  });
});
