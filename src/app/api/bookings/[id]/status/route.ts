/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateBookingStatus } from "@/services/marketplace/booking-service";
import type { BookingStatus } from "@/types/marketplace";
import { sendViewingConfirmation, BASE_URL } from "@/services/email/email-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body as {
      status: BookingStatus;
      reason?: string;
    };

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    const booking = await updateBookingStatus(
      supabase,
      user.id,
      id,
      status,
      reason,
    );

    // Fire-and-forget: send confirmation email to the customer when booking is confirmed
    if (status === "confirmed") {
      try {
        const { data: customerProfile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("id", booking.user_id)
          .single();

        // Fetch related service request for a description
        const { data: serviceRequest } = await supabase
          .from("service_requests")
          .select("title, service_category")
          .eq("id", booking.service_request_id)
          .maybeSingle();

        // Fetch provider profile for agentName equivalent
        const { data: providerProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", booking.provider_id)
          .single();

        if (customerProfile?.email) {
          const firstName =
            (customerProfile.display_name as string | undefined)?.split(" ")[0] ?? "";
          const serviceTitle =
            (serviceRequest?.title as string | undefined) ??
            (serviceRequest?.service_category as string | undefined) ??
            "your booking";
          const providerName =
            (providerProfile?.display_name as string | undefined) ?? "Your provider";

          const viewingDate = new Date(booking.scheduled_start_date as unknown as string)
            .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          const viewingTime = new Date(booking.scheduled_start_date as unknown as string)
            .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

          void sendViewingConfirmation({
            userId: booking.user_id as string,
            email: customerProfile.email as string,
            firstName,
            propertyAddress: serviceTitle,
            viewingDate,
            viewingTime,
            agentName: providerName,
            propertyUrl: `${BASE_URL}/dashboard/bookings/${booking.id}`,
          });
        }
      } catch (emailError) {
        console.error("PATCH /api/bookings/[id]/status sendViewingConfirmation error:", emailError);
      }
    }

    return NextResponse.json({ data: booking }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update booking status";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("Cannot transition")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes("Reason is required")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
