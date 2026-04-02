import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AvailabilityCalendar } from "@/components/dashboard/provider/AvailabilityCalendar";
import { Shield, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderAvailabilityPage() {
  try {
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

  const bookedCount = bookings.length;
  const blockedCount = blockedRanges.length;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-heading text-neutral-900 mb-2">
            Availability Calendar
          </h1>
          <p className="text-neutral-500 text-sm max-w-lg">
            Manage your service hours, block off personal time, and sync with your external
            calendars to prevent double booking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-full hover:shadow-lg transition-shadow active:scale-95">
            <Shield className="size-4" />
            Quick Block
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-sm font-semibold rounded-full hover:bg-neutral-50 transition-colors active:scale-95">
            <RefreshCw className="size-4" />
            Sync External
          </button>
        </div>
      </div>

      {/* ── Calendar Controls + Legend Sidebar ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Working Hours Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-sm">
              <span className="text-emerald-700">⏰</span>
              Default Working Hours
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Mon – Fri</span>
                <span className="text-sm font-bold text-neutral-900">08:00 – 18:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Sat</span>
                <span className="text-sm font-bold text-neutral-900">10:00 – 15:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Sun</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded">
                  CLOSED
                </span>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-emerald-900 border border-emerald-900/20 rounded-lg hover:bg-emerald-50 transition-colors">
              Edit Default Hours
            </button>
          </div>

          {/* External Sync */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-bold text-neutral-900 mb-4 text-sm">External Sync</h3>
            <div className="space-y-3">
              {/* Google Calendar */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="h-8 w-8 bg-white border border-neutral-200 rounded flex items-center justify-center text-blue-600 text-sm font-bold">
                  G
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-neutral-900 leading-none">
                    Google Calendar
                  </p>
                  <p className="text-[11px] text-success font-medium mt-0.5">Connected</p>
                </div>
                <span className="text-success text-sm">✓</span>
              </div>
              {/* Outlook */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 opacity-60">
                <div className="h-8 w-8 bg-white border border-neutral-200 rounded flex items-center justify-center text-blue-800 text-sm font-bold">
                  O
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-neutral-900 leading-none">Outlook</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Not connected</p>
                </div>
                <button className="text-[11px] font-bold text-emerald-700 hover:underline">
                  Link
                </button>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-bold text-neutral-900 mb-4 text-sm">Color Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-brand-primary-lighter border border-brand-primary" />
                <span className="text-xs font-medium text-neutral-600">
                  Booked Jobs ({bookedCount})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-neutral-200" />
                <span className="text-xs font-medium text-neutral-600">
                  Personal Time ({blockedCount})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded border border-neutral-300 bg-white" />
                <span className="text-xs font-medium text-neutral-600">Available Slots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
            <AvailabilityCalendar
              initialBlockedRanges={blockedRanges}
              initialBookings={bookings}
            />
          </div>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold font-heading text-neutral-900">Availability Calendar</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load availability data. Please try refreshing the page.</p>
      </div>
    );
  }
}
