import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import type { ProviderAvailability, Booking } from "@/types/marketplace";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import { AvailabilityCalendar } from "@/components/provider/AvailabilityCalendar";

// -- fixtures ---------------------------------------------------------------

function makePeriod(
  overrides: Partial<ProviderAvailability> = {},
): ProviderAvailability {
  return {
    id: "period-1",
    provider_id: "prov-1",
    start_date: new Date("2026-07-01"),
    end_date: new Date("2026-07-07"),
    reason: "Holiday",
    created_at: new Date("2026-06-01"),
    updated_at: new Date("2026-06-01"),
    ...overrides,
  };
}

type BookingPick = Pick<
  Booking,
  "id" | "booking_reference" | "scheduled_start_date" | "scheduled_end_date"
>;

function makeBooking(overrides: Partial<BookingPick> = {}): BookingPick {
  return {
    id: "book-1",
    booking_reference: "BK-1001",
    scheduled_start_date: new Date("2026-08-10"),
    scheduled_end_date: new Date("2026-08-12"),
    ...overrides,
  };
}

beforeEach(() => {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
});

describe("AvailabilityCalendar", () => {
  describe("render: empty state", () => {
    it("shows the empty-state message when there are no periods", () => {
      render(<AvailabilityCalendar />);
      expect(
        screen.getByText(/No unavailable periods set/i),
      ).toBeInTheDocument();
    });

    it("does not render a confirmed-bookings section when there are none", () => {
      render(<AvailabilityCalendar />);
      expect(screen.queryByText("Confirmed Bookings")).not.toBeInTheDocument();
    });
  });

  describe("render: with data", () => {
    it("renders confirmed bookings with reference, date range and a Booked badge", () => {
      render(
        <AvailabilityCalendar
          confirmedBookings={[
            makeBooking({ booking_reference: "BK-2002" }),
          ]}
        />,
      );
      expect(screen.getByText("Confirmed Bookings")).toBeInTheDocument();
      expect(screen.getByText("BK-2002")).toBeInTheDocument();
      expect(screen.getByText("Booked")).toBeInTheDocument();
      // formatDateRange uses en-GB "10 Aug 2026 - 12 Aug 2026".
      expect(screen.getByText(/10 Aug 2026 - 12 Aug 2026/)).toBeInTheDocument();
    });

    it("renders existing unavailable periods with formatted range and reason", () => {
      render(
        <AvailabilityCalendar
          unavailablePeriods={[makePeriod({ reason: "Annual leave" })]}
        />,
      );
      expect(screen.getByText(/1 Jul 2026 - 7 Jul 2026/)).toBeInTheDocument();
      expect(screen.getByText("Annual leave")).toBeInTheDocument();
      expect(
        screen.queryByText(/No unavailable periods set/i),
      ).not.toBeInTheDocument();
    });

    it("renders a period without a reason", () => {
      render(
        <AvailabilityCalendar
          unavailablePeriods={[makePeriod({ reason: null })]}
        />,
      );
      expect(screen.getByText(/1 Jul 2026 - 7 Jul 2026/)).toBeInTheDocument();
    });
  });

  describe("add-period form toggle", () => {
    it("opens the add form and switches the toggle label to Cancel", () => {
      render(<AvailabilityCalendar onAddPeriod={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: /Add Period/i }));

      expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
      expect(screen.getByLabelText("End Date")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Cancel/i }),
      ).toBeInTheDocument();
    });

    it("closes the form again on a second toggle click", () => {
      render(<AvailabilityCalendar onAddPeriod={vi.fn()} />);
      const toggle = screen.getByRole("button", { name: /Add Period/i });
      fireEvent.click(toggle);
      expect(screen.getByLabelText("Start Date")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(screen.queryByLabelText("Start Date")).not.toBeInTheDocument();
    });
  });

  describe("add-period submission (handler provided by parent)", () => {
    function openFormAndFill(start: string, end: string, reason?: string) {
      fireEvent.click(screen.getByRole("button", { name: /Add Period/i }));
      fireEvent.change(screen.getByLabelText("Start Date"), {
        target: { value: start },
      });
      fireEvent.change(screen.getByLabelText("End Date"), {
        target: { value: end },
      });
      if (reason !== undefined) {
        fireEvent.change(screen.getByLabelText(/Reason/i), {
          target: { value: reason },
        });
      }
    }

    it("calls onAddPeriod with the entered values and shows a success toast", async () => {
      const onAddPeriod = vi.fn().mockResolvedValue(undefined);
      render(<AvailabilityCalendar onAddPeriod={onAddPeriod} />);

      openFormAndFill("2026-09-01", "2026-09-05", "Training");
      fireEvent.click(
        screen.getByRole("button", { name: /Add Unavailable Period/i }),
      );

      await waitFor(() => expect(onAddPeriod).toHaveBeenCalledTimes(1));
      // The zod resolver coerces the date <input> strings to Date objects
      // (providerAvailabilitySchema uses z.coerce.date()) before onAddPeriod runs.
      const payload = onAddPeriod.mock.calls[0][0];
      expect(new Date(payload.start_date).toISOString()).toBe(
        "2026-09-01T00:00:00.000Z",
      );
      expect(new Date(payload.end_date).toISOString()).toBe(
        "2026-09-05T00:00:00.000Z",
      );
      expect(payload.reason).toBe("Training");
      expect(toastMock.success).toHaveBeenCalledWith("Unavailable period added");
    });

    it("blocks an end date before the start date with a validation error", async () => {
      const onAddPeriod = vi.fn().mockResolvedValue(undefined);
      render(<AvailabilityCalendar onAddPeriod={onAddPeriod} />);

      openFormAndFill("2026-09-10", "2026-09-01");
      fireEvent.click(
        screen.getByRole("button", { name: /Add Unavailable Period/i }),
      );

      expect(
        await screen.findByText(/End date must be on or after start date/i),
      ).toBeInTheDocument();
      expect(onAddPeriod).not.toHaveBeenCalled();
    });

    it("surfaces a rejected handler as an error toast", async () => {
      const onAddPeriod = vi
        .fn()
        .mockRejectedValue(new Error("Overlaps a confirmed booking"));
      render(<AvailabilityCalendar onAddPeriod={onAddPeriod} />);

      openFormAndFill("2026-09-01", "2026-09-05");
      fireEvent.click(
        screen.getByRole("button", { name: /Add Unavailable Period/i }),
      );

      await waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith(
          "Overlaps a confirmed booking",
        ),
      );
    });
  });

  describe("remove period", () => {
    it("renders a remove control only when onRemovePeriod is provided", () => {
      const { rerender } = render(
        <AvailabilityCalendar unavailablePeriods={[makePeriod()]} />,
      );
      expect(
        screen.queryByRole("button", { name: /Remove period/i }),
      ).not.toBeInTheDocument();

      rerender(
        <AvailabilityCalendar
          unavailablePeriods={[makePeriod()]}
          onRemovePeriod={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /Remove period/i }),
      ).toBeInTheDocument();
    });

    it("calls onRemovePeriod with the period id and shows a success toast", async () => {
      const onRemovePeriod = vi.fn().mockResolvedValue(undefined);
      render(
        <AvailabilityCalendar
          unavailablePeriods={[makePeriod({ id: "period-42" })]}
          onRemovePeriod={onRemovePeriod}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Remove period/i }));

      await waitFor(() =>
        expect(onRemovePeriod).toHaveBeenCalledWith("period-42"),
      );
      expect(toastMock.success).toHaveBeenCalledWith("Period removed");
    });

    it("surfaces a failed removal as an error toast", async () => {
      const onRemovePeriod = vi
        .fn()
        .mockRejectedValue(new Error("Cannot remove"));
      render(
        <AvailabilityCalendar
          unavailablePeriods={[makePeriod()]}
          onRemovePeriod={onRemovePeriod}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Remove period/i }));

      await waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith("Cannot remove"),
      );
    });
  });

  describe("multiple periods", () => {
    it("renders every period row", () => {
      render(
        <AvailabilityCalendar
          unavailablePeriods={[
            makePeriod({ id: "p1", start_date: new Date("2026-07-01"), end_date: new Date("2026-07-02"), reason: "A" }),
            makePeriod({ id: "p2", start_date: new Date("2026-08-01"), end_date: new Date("2026-08-02"), reason: "B" }),
          ]}
          onRemovePeriod={vi.fn()}
        />,
      );
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /Remove period/i }),
      ).toHaveLength(2);
    });
  });
});
