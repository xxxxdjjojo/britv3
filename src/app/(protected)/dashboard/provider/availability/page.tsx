import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AvailabilityCalendar } from "@/components/dashboard/provider/AvailabilityCalendar";

export const dynamic = "force-dynamic";

export default async function ProviderAvailabilityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve provider id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  // Window: current month + next 2 months
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  // End = last day of (current month + 2)
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0)
    .toISOString()
    .slice(0, 10);

  const [availabilityResult, bookingsResult] = await Promise.all([
    supabase
      .from("provider_availability")
      .select("id, provider_id, start_date, end_date, reason")
      .eq("provider_id", providerId)
      .lte("start_date", windowEnd)
      .gte("end_date", windowStart)
      .order("start_date", { ascending: true }),

    supabase
      .from("bookings")
      .select("id, booking_reference, scheduled_start_date, scheduled_end_date")
      .eq("provider_id", providerId)
      .in("status", ["confirmed", "in_progress"])
      .gte("scheduled_start_date", windowStart)
      .lte("scheduled_end_date", windowEnd)
      .order("scheduled_start_date", { ascending: true }),
  ]);

  // Normalise dates to ISO strings for client component serialisation
  const blockedRanges = (availabilityResult.data ?? []).map((r) => ({
    id: r.id as string,
    start_date: r.start_date as string,
    end_date: r.end_date as string,
    reason: (r.reason as string | null) ?? null,
  }));

  const bookings = (bookingsResult.data ?? []).map((b) => ({
    id: b.id as string,
    booking_reference: b.booking_reference as string,
    scheduled_start_date: b.scheduled_start_date as string,
    scheduled_end_date: b.scheduled_end_date as string,
  }));

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Availability</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Click any available date to mark it as unavailable. Click a blocked
          date to unblock it. Booked dates cannot be changed.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <AvailabilityCalendar
          initialBlockedRanges={blockedRanges}
          initialBookings={bookings}
        />
      </div>
    </div>
  );
}
