import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBooking,
  updateBookingStatus,
  checkDateConflict,
  setProviderAvailability,
} from "./booking-service";

// -- Helpers ------------------------------------------------------------------

/**
 * Build a thenable Supabase mock from a table->handler map.
 * Each handler returns partial chain methods for that table.
 */
function mockSupabase(
  tableHandlers: Record<string, () => Record<string, unknown>>,
) {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    const handler = tableHandlers[table];
    if (handler) return handler();
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
  });
  return { from: fromMock, auth: { getUser: vi.fn() } } as unknown;
}

// -- Tests --------------------------------------------------------------------

describe("booking-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBooking", () => {
    it("should verify quote is accepted before creating", async () => {
      const supabase = mockSupabase({
        quotes: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "quote-1",
                  status: "sent", // Not accepted
                  provider_id: "prov-1",
                  service_request_id: "rfq-1",
                  service_requests: { user_id: "user-1" },
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      await expect(
        createBooking(supabase as never, "user-1", {
          quote_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          scheduled_start_date: new Date("2026-04-01"),
          scheduled_end_date: new Date("2026-04-02"),
        }),
      ).rejects.toThrow("Quote must be accepted");
    });

    it("should create booking from accepted quote with no conflicts", async () => {
      const mockBooking = {
        id: "booking-1",
        quote_id: "quote-1",
        user_id: "user-1",
        provider_id: "prov-1",
        status: "pending_confirmation",
        booking_reference: "BK-2026-0001",
      };

      const supabase = mockSupabase({
        quotes: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "quote-1",
                  status: "accepted",
                  provider_id: "prov-1",
                  service_request_id: "rfq-1",
                  service_requests: { user_id: "user-1" },
                },
                error: null,
              }),
            }),
          }),
        }),
        bookings: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockBooking,
                error: null,
              }),
            }),
          }),
        }),
        provider_availability: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
        booking_status_history: () => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await createBooking(supabase as never, "user-1", {
        quote_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        scheduled_start_date: new Date("2026-04-01"),
        scheduled_end_date: new Date("2026-04-02"),
      });

      expect(result.id).toBe("booking-1");
      expect(result.status).toBe("pending_confirmation");
    });
  });

  describe("updateBookingStatus", () => {
    it("should allow valid transition (pending_confirmation -> confirmed by provider)", async () => {
      const updatedBooking = {
        id: "booking-1",
        user_id: "user-1",
        provider_id: "prov-1",
        status: "confirmed",
      };

      const supabase = mockSupabase({
        bookings: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "booking-1",
                  user_id: "user-1",
                  provider_id: "prov-1",
                  status: "pending_confirmation",
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedBooking,
                  error: null,
                }),
              }),
            }),
          }),
        }),
        booking_status_history: () => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await updateBookingStatus(
        supabase as never,
        "prov-1", // Provider confirms
        "booking-1",
        "confirmed",
      );

      expect(result.status).toBe("confirmed");
    });

    it("should reject invalid transition (pending_confirmation -> completed by user)", async () => {
      const supabase = mockSupabase({
        bookings: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "booking-1",
                  user_id: "user-1",
                  provider_id: "prov-1",
                  status: "pending_confirmation",
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      await expect(
        updateBookingStatus(
          supabase as never,
          "user-1",
          "booking-1",
          "completed",
        ),
      ).rejects.toThrow("Cannot transition from 'pending_confirmation' to 'completed'");
    });

    it("should require reason for cancellation from in_progress by provider", async () => {
      const supabase = mockSupabase({
        bookings: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "booking-1",
                  user_id: "user-1",
                  provider_id: "prov-1",
                  status: "in_progress",
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      await expect(
        updateBookingStatus(
          supabase as never,
          "prov-1",
          "booking-1",
          "cancelled",
          // No reason provided
        ),
      ).rejects.toThrow("Reason is required");
    });
  });

  describe("checkDateConflict", () => {
    it("should detect overlapping bookings", async () => {
      const supabase = mockSupabase({
        bookings: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "booking-existing",
                        scheduled_start_date: "2026-04-01T00:00:00Z",
                        scheduled_end_date: "2026-04-05T00:00:00Z",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        provider_availability: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await checkDateConflict(
        supabase as never,
        "prov-1",
        new Date("2026-04-03"),
        new Date("2026-04-07"),
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingBookings).toHaveLength(1);
      expect(result.conflictingBookings[0].id).toBe("booking-existing");
    });

    it("should allow non-overlapping bookings", async () => {
      const supabase = mockSupabase({
        bookings: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        provider_availability: () => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await checkDateConflict(
        supabase as never,
        "prov-1",
        new Date("2026-05-01"),
        new Date("2026-05-03"),
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingBookings).toHaveLength(0);
    });
  });

  describe("setProviderAvailability", () => {
    it("should validate date range (end must be after start)", async () => {
      const supabase = mockSupabase({});

      await expect(
        setProviderAvailability(
          supabase as never,
          "prov-1",
          new Date("2026-04-05"),
          new Date("2026-04-01"), // End before start
          "Holiday",
        ),
      ).rejects.toThrow("End date must be after start date");
    });

    it("should insert unavailability period with valid dates", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      const supabase = mockSupabase({
        provider_availability: () => ({
          insert: insertMock,
        }),
      });

      await setProviderAvailability(
        supabase as never,
        "prov-1",
        new Date("2026-04-01"),
        new Date("2026-04-05"),
        "Holiday",
      );

      expect(insertMock).toHaveBeenCalledWith({
        provider_id: "prov-1",
        start_date: expect.any(String),
        end_date: expect.any(String),
        reason: "Holiday",
      });
    });
  });
});
