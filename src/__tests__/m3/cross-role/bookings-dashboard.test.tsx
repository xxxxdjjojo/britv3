import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import type { BookingStatus } from "@/types/marketplace";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import BookingsPage from "@/app/(protected)/dashboard/bookings/page";

type BookingRow = {
  id: string;
  booking_reference: string;
  service_title: string;
  other_party_name: string;
  scheduled_start_date: string;
  scheduled_end_date: string;
  total_amount: number;
  status: BookingStatus;
};

function booking(overrides?: Partial<BookingRow>): BookingRow {
  return {
    id: "bk-1",
    booking_reference: "BR-1001",
    service_title: "Boiler service",
    other_party_name: "PlumbCo",
    scheduled_start_date: "2026-02-01T09:00:00Z",
    scheduled_end_date: "2026-02-01T12:00:00Z",
    total_amount: 150,
    status: "confirmed",
    ...overrides,
  };
}

function mockFetch(bookings: BookingRow[], counts?: Partial<Record<BookingStatus, number>>) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ bookings, counts }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("BookingsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the status tab triggers", async () => {
    mockFetch([]);
    render(<BookingsPage />);
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "pending confirmation" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "completed" })).toBeInTheDocument();
  });

  it("renders status counts from the stat cards", async () => {
    mockFetch([], {
      pending_confirmation: 4,
      confirmed: 2,
      in_progress: 1,
      completed: 7,
    });
    render(<BookingsPage />);
    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the empty state when there are no bookings", async () => {
    mockFetch([]);
    render(<BookingsPage />);
    await waitFor(() => expect(screen.getByText("No bookings found.")).toBeInTheDocument());
  });

  it("renders a booking row with reference, service, and status badge", async () => {
    mockFetch([booking({ booking_reference: "BR-2002", status: "completed" })]);
    render(<BookingsPage />);
    await waitFor(() => expect(screen.getByText("BR-2002")).toBeInTheDocument());
    expect(screen.getByText("Boiler service")).toBeInTheDocument();
    // "Completed" also appears as a stat-card label; scope to the status badge cell.
    const statusCell = screen.getByText("BR-2002").closest("tr")!;
    expect(within(statusCell).getByText("Completed")).toBeInTheDocument();
  });

  it("fetches without a status query on the All tab initially", async () => {
    const fetchMock = mockFetch([]);
    render(<BookingsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/bookings/list"));
  });

  it("refetches with a status query when a status tab is selected", async () => {
    const fetchMock = mockFetch([]);
    render(<BookingsPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: "completed" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/bookings/list?status=completed"),
    );
  });

  it("formats the booking amount as GBP currency", async () => {
    mockFetch([booking({ total_amount: 150 })]);
    render(<BookingsPage />);
    await waitFor(() => expect(screen.getByText("£150.00")).toBeInTheDocument());
  });
});
