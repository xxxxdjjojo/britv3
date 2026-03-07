/**
 * Booking service -- handles the full booking lifecycle from quote acceptance
 * through completion, including state machine transitions, date conflict
 * detection, provider availability management, and status history audit trail.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingCreateInput } from "@/lib/validators/marketplace-schemas";
import type { Booking, BookingStatus } from "@/types/marketplace";
import {
  canTransition,
  getValidNextStatuses,
} from "@/lib/marketplace/booking-state-machine";
import type { TransitionActor } from "@/lib/marketplace/booking-state-machine";
import { bookingCreateSchema } from "@/lib/validators/marketplace-schemas";

// -- Types --------------------------------------------------------------------

type DateConflictResult = Readonly<{
  hasConflict: boolean;
  conflictingBookings: Array<{ id: string; start: Date; end: Date }>;
}>;

type AvailabilityResult = Readonly<{
  unavailablePeriods: Array<{
    id: string;
    start_date: Date;
    end_date: Date;
    reason: string | null;
  }>;
  bookedPeriods: Array<{
    id: string;
    scheduled_start_date: Date;
    scheduled_end_date: Date;
    status: BookingStatus;
  }>;
}>;

// -- Service functions --------------------------------------------------------

/**
 * Create a booking from an accepted quote.
 * Validates the quote is accepted, checks for date conflicts, and creates
 * the booking with an initial status history entry.
 */
export async function createBooking(
  supabase: SupabaseClient,
  userId: string,
  data: BookingCreateInput,
): Promise<Booking> {
  const parsed = bookingCreateSchema.parse(data);

  // Fetch the quote and verify it is accepted
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, service_requests!inner(user_id)")
    .eq("id", parsed.quote_id)
    .single();

  if (quoteError || !quote) {
    throw new Error("Quote not found");
  }

  if (quote.status !== "accepted") {
    throw new Error("Quote must be accepted before creating a booking");
  }

  // Verify user owns the RFQ that the quote belongs to
  const rfqOwnerId = (quote.service_requests as { user_id: string }).user_id;
  if (rfqOwnerId !== userId) {
    throw new Error("Only the RFQ owner can create a booking from this quote");
  }

  // Check for date conflicts with the provider
  const conflict = await checkDateConflict(
    supabase,
    quote.provider_id as string,
    parsed.scheduled_start_date,
    parsed.scheduled_end_date,
  );

  if (conflict.hasConflict) {
    throw new Error("Date conflict: provider has overlapping bookings or unavailability");
  }

  // Insert the booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      service_request_id: quote.service_request_id,
      quote_id: parsed.quote_id,
      user_id: userId,
      provider_id: quote.provider_id,
      scheduled_start_date: parsed.scheduled_start_date.toISOString(),
      scheduled_end_date: parsed.scheduled_end_date.toISOString(),
      status: "pending_confirmation" as const,
    })
    .select()
    .single();

  if (bookingError) {
    throw new Error(`Failed to create booking: ${bookingError.message}`);
  }

  // Insert initial status history entry
  await supabase.from("booking_status_history").insert({
    booking_id: booking.id,
    from_status: null,
    to_status: "pending_confirmation",
    changed_by: userId,
    reason: "Booking created from accepted quote",
  });

  return booking as Booking;
}

/**
 * Get a single booking by ID with related data.
 * Includes service request, quote, user/provider profiles, and status history.
 */
export async function getBooking(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<Booking & { status_history?: unknown[] }> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "*, service_requests(title, service_category), quotes(total_amount, scope_of_work)",
    )
    .eq("id", bookingId)
    .single();

  if (error) {
    throw new Error(`Booking not found: ${error.message}`);
  }

  // Fetch status history separately
  const { data: history } = await supabase
    .from("booking_status_history")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  return { ...booking, status_history: history ?? [] } as Booking & {
    status_history: unknown[];
  };
}

/**
 * List bookings for a user or provider with optional status filter.
 * Returns paginated results with booking counts by status.
 */
export async function listBookings(
  supabase: SupabaseClient,
  userId: string,
  role: "user" | "provider",
  status?: BookingStatus,
  limit = 20,
  offset = 0,
): Promise<{
  bookings: Booking[];
  total: number;
  counts: Record<string, number>;
}> {
  const filterColumn = role === "user" ? "user_id" : "provider_id";

  // Build main query
  let query = supabase
    .from("bookings")
    .select("*, service_requests(title, service_category)", { count: "exact" })
    .eq(filterColumn, userId)
    .order("scheduled_start_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list bookings: ${error.message}`);
  }

  // Get counts by status
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("status")
    .eq(filterColumn, userId);

  const counts: Record<string, number> = {};
  if (allBookings) {
    for (const b of allBookings) {
      const s = b.status as string;
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }

  return {
    bookings: (data ?? []) as Booking[],
    total: count ?? 0,
    counts,
  };
}

/**
 * Update booking status with state machine validation.
 * Determines actor role from userId, validates transition, requires reason
 * when specified, and logs to status history.
 */
export async function updateBookingStatus(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string,
  newStatus: BookingStatus,
  reason?: string,
): Promise<Booking> {
  // Load current booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  // Determine actor role
  let actorRole: TransitionActor;
  if (userId === booking.user_id) {
    actorRole = "user";
  } else if (userId === booking.provider_id) {
    actorRole = "provider";
  } else {
    actorRole = "system";
  }

  const currentStatus = booking.status as BookingStatus;
  const transition = canTransition(currentStatus, newStatus, actorRole);

  if (!transition.allowed) {
    const validNext = getValidNextStatuses(currentStatus, actorRole);
    const validStr =
      validNext.length > 0 ? validNext.join(", ") : "none";
    throw new Error(
      `Cannot transition from '${currentStatus}' to '${newStatus}'. ` +
        `Valid next statuses for ${actorRole}: ${validStr}`,
    );
  }

  if (transition.requiresReason && !reason) {
    throw new Error(
      `Reason is required when transitioning from '${currentStatus}' to '${newStatus}'`,
    );
  }

  // Update booking status
  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "cancelled") {
    updateData.cancellation_reason = reason ?? null;
    updateData.cancelled_by = userId;
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update booking status: ${updateError.message}`);
  }

  // Log to status history
  await supabase.from("booking_status_history").insert({
    booking_id: bookingId,
    from_status: currentStatus,
    to_status: newStatus,
    changed_by: userId,
    reason: reason ?? null,
  });

  return updated as Booking;
}

/**
 * Check for date conflicts for a provider.
 * Checks both active bookings and provider unavailability periods.
 */
export async function checkDateConflict(
  supabase: SupabaseClient,
  providerId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string,
): Promise<DateConflictResult> {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  // Check overlapping bookings (confirmed or in_progress)
  let bookingQuery = supabase
    .from("bookings")
    .select("id, scheduled_start_date, scheduled_end_date")
    .eq("provider_id", providerId)
    .in("status", ["confirmed", "in_progress"])
    .lte("scheduled_start_date", endIso)
    .gte("scheduled_end_date", startIso);

  if (excludeBookingId) {
    bookingQuery = bookingQuery.neq("id", excludeBookingId);
  }

  const { data: conflicting } = await bookingQuery;

  // Check provider unavailability periods
  const { data: unavailable } = await supabase
    .from("provider_availability")
    .select("id, start_date, end_date")
    .eq("provider_id", providerId)
    .lte("start_date", endIso)
    .gte("end_date", startIso);

  const conflicts: Array<{ id: string; start: Date; end: Date }> = [];

  if (conflicting) {
    for (const b of conflicting) {
      conflicts.push({
        id: b.id as string,
        start: new Date(b.scheduled_start_date as string),
        end: new Date(b.scheduled_end_date as string),
      });
    }
  }

  if (unavailable) {
    for (const u of unavailable) {
      conflicts.push({
        id: u.id as string,
        start: new Date(u.start_date as string),
        end: new Date(u.end_date as string),
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflictingBookings: conflicts,
  };
}

/**
 * Set a provider's unavailability period.
 * Validates end date is after start date.
 */
export async function setProviderAvailability(
  supabase: SupabaseClient,
  providerId: string,
  startDate: Date,
  endDate: Date,
  reason?: string,
): Promise<void> {
  if (endDate <= startDate) {
    throw new Error("End date must be after start date");
  }

  const { error } = await supabase.from("provider_availability").insert({
    provider_id: providerId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    reason: reason ?? null,
  });

  if (error) {
    throw new Error(`Failed to set availability: ${error.message}`);
  }
}

/**
 * Get a provider's availability (unavailable periods + booked periods).
 */
export async function getProviderAvailability(
  supabase: SupabaseClient,
  providerId: string,
  fromDate?: Date,
  toDate?: Date,
): Promise<AvailabilityResult> {
  // Unavailable periods
  let unavailQuery = supabase
    .from("provider_availability")
    .select("id, start_date, end_date, reason")
    .eq("provider_id", providerId)
    .order("start_date", { ascending: true });

  if (fromDate) {
    unavailQuery = unavailQuery.gte("end_date", fromDate.toISOString());
  }
  if (toDate) {
    unavailQuery = unavailQuery.lte("start_date", toDate.toISOString());
  }

  const { data: unavailable } = await unavailQuery;

  // Booked periods (confirmed or in_progress)
  let bookedQuery = supabase
    .from("bookings")
    .select("id, scheduled_start_date, scheduled_end_date, status")
    .eq("provider_id", providerId)
    .in("status", ["confirmed", "in_progress"])
    .order("scheduled_start_date", { ascending: true });

  if (fromDate) {
    bookedQuery = bookedQuery.gte(
      "scheduled_end_date",
      fromDate.toISOString(),
    );
  }
  if (toDate) {
    bookedQuery = bookedQuery.lte(
      "scheduled_start_date",
      toDate.toISOString(),
    );
  }

  const { data: booked } = await bookedQuery;

  return {
    unavailablePeriods: (unavailable ?? []) as AvailabilityResult["unavailablePeriods"],
    bookedPeriods: (booked ?? []) as AvailabilityResult["bookedPeriods"],
  };
}
