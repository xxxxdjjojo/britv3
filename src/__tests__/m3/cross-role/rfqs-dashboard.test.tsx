import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { RfqStatus } from "@/types/marketplace";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import RfqsPage from "@/app/(protected)/dashboard/rfqs/page";

type RfqRow = {
  id: string;
  title: string;
  service_category: string;
  quote_count: number;
  status: RfqStatus;
  created_at: string;
};

function rfq(overrides?: Partial<RfqRow>): RfqRow {
  return {
    id: "rfq-1",
    title: "Boiler replacement",
    service_category: "plumbing_heating",
    quote_count: 3,
    status: "open",
    created_at: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

function mockFetch(rows: RfqRow[]) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ data: rows }) });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("RfqsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty state when there are no RFQs", async () => {
    mockFetch([]);
    render(<RfqsPage />);
    await waitFor(() =>
      expect(screen.getByText(/No RFQs found/i)).toBeInTheDocument(),
    );
  });

  it("renders an RFQ row with title, quote count and status badge", async () => {
    mockFetch([rfq({ title: "Garden landscaping", quote_count: 2, status: "quotes_received" })]);
    render(<RfqsPage />);
    await waitFor(() => expect(screen.getByText("Garden landscaping")).toBeInTheDocument());
    expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
    // "quotes received" appears as both the filter button and the row badge.
    expect(screen.getAllByText("quotes received").length).toBeGreaterThanOrEqual(2);
  });

  it("renders all status filter buttons including All", () => {
    mockFetch([]);
    render(<RfqsPage />);
    ["All", "open", "quotes received", "awarded", "cancelled", "expired"].forEach((label) =>
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument(),
    );
  });

  it("fetches without a status query on initial load (All)", async () => {
    const fetchMock = mockFetch([]);
    render(<RfqsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/rfq/list"));
  });

  it("refetches with a status query when a filter is selected", async () => {
    const fetchMock = mockFetch([]);
    render(<RfqsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "awarded" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/rfq/list?status=awarded"),
    );
  });

  it("formats the service category by replacing underscores", async () => {
    mockFetch([rfq({ service_category: "plumbing_heating" })]);
    render(<RfqsPage />);
    await waitFor(() => expect(screen.getByText("plumbing heating")).toBeInTheDocument());
  });
});
