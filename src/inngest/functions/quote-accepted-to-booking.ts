/**
 * Inngest function: quote-accepted-to-booking
 *
 * Triggered when a homeowner accepts a provider quote.
 * Creates a booking record from the accepted quote via the marketplace
 * booking-service, then optionally creates payment schedules if the
 * quote has milestone metadata.
 *
 * Event: "provider/quote.accepted"
 * Data: { quoteId, providerId, requestId, userId }
 */

import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBooking } from "@/services/marketplace/booking-service";
import { createPaymentSchedule } from "@/services/provider/provider-payment-schedule-service";
import type { MilestoneInput } from "@/services/provider/provider-payment-schedule-service";

type QuoteAcceptedEventData = {
  quoteId: string;
  providerId: string;
  requestId: string;
  userId: string;
};

/** Adds N days to today and returns a Date. */
function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export const quoteAcceptedToBooking = inngest.createFunction(
  {
    id: "quote-accepted-to-booking",
    name: "Create booking from accepted quote",
    retries: 3,
  },
  { event: "provider/quote.accepted" },
  async ({ event, step }) => {
    const { quoteId, providerId, requestId, userId } =
      event.data as QuoteAcceptedEventData;

    // Step 1: Fetch quote + service_request details
    const { quote, serviceRequest } = await step.run(
      "fetch-quote-and-request",
      async () => {
        const supabase = createAdminClient();

        const { data: quoteData, error: quoteError } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", quoteId)
          .single();

        if (quoteError || !quoteData) {
          throw new Error(`Quote ${quoteId} not found: ${quoteError?.message ?? "no data"}`);
        }

        const { data: srData, error: srError } = await supabase
          .from("service_requests")
          .select("id, preferred_start_date")
          .eq("id", requestId)
          .single();

        if (srError || !srData) {
          throw new Error(`Service request ${requestId} not found: ${srError?.message ?? "no data"}`);
        }

        return {
          quote: quoteData as {
            id: string;
            provider_id: string;
            total_amount: number;
            milestones?: MilestoneInput[];
          },
          serviceRequest: srData as {
            id: string;
            preferred_start_date: string | null;
          },
        };
      },
    );

    // Step 2: Determine scheduled dates
    //  - Use the service_request's preferred_start_date if available
    //  - Otherwise default to 7 days from now (start) + 1 day (end)
    const scheduledStartDate = serviceRequest.preferred_start_date
      ? new Date(serviceRequest.preferred_start_date)
      : addDays(7);

    // Default end date: start + 1 day (provider confirms exact duration later)
    const scheduledEndDate = new Date(scheduledStartDate);
    scheduledEndDate.setDate(scheduledEndDate.getDate() + 1);

    // Step 3: Create the booking
    const booking = await step.run("create-booking", async () => {
      const supabase = createAdminClient();

      return createBooking(supabase, userId, {
        quote_id: quoteId,
        scheduled_start_date: scheduledStartDate,
        scheduled_end_date: scheduledEndDate,
      });
    });

    // Step 4 (optional): Create payment schedule if quote has milestone metadata
    const milestones = quote.milestones;

    if (Array.isArray(milestones) && milestones.length > 0) {
      await step.run("create-payment-schedule", async () => {
        const supabase = createAdminClient();

        return createPaymentSchedule(
          providerId,
          booking.id,
          quoteId,
          milestones,
          quote.total_amount,
          supabase,
        );
      });
    }

    return {
      status: "completed",
      bookingId: booking.id,
      quoteId,
      providerId,
      userId,
    };
  },
);
