"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  RotateCcw,
  X,
  AlertCircle,
  User,
} from "lucide-react";
import { useViewings, useCancelViewing } from "@/hooks/useViewings";
import type { Viewing } from "@/services/viewings/viewings-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function formatDateShort(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

const ACTIVE_STATUSES = new Set<Viewing["status"]>(["confirmed", "rescheduled"]);
const PAST_STATUSES = new Set<Viewing["status"]>(["completed", "cancelled"]);

function statusBadge(status: Viewing["status"]): { label: string; className: string; dot: string } {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-primary-container/20 text-brand-primary",
        dot: "bg-brand-primary",
      };
    case "rescheduled":
      return {
        label: "Pending",
        className: "bg-secondary-container/20 text-on-secondary-container",
        dot: "bg-secondary-fixed-dim",
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-inverse-surface/60 text-on-inverse-surface",
        dot: "bg-outline",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-error text-on-inverse-surface",
        dot: "bg-error",
      };
  }
}

function borderColor(status: Viewing["status"]): string {
  if (status === "confirmed") return "border-brand-primary";
  if (status === "rescheduled") return "border-secondary-fixed-dim";
  return "border-outline-variant";
}

// ---------------------------------------------------------------------------
// Upcoming viewing card (Stitch itinerary style)
// ---------------------------------------------------------------------------

function UpcomingViewingCard({
  viewing,
  role,
  onCancel,
  isCancelling,
}: Readonly<{
  viewing: Viewing;
  role: string;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}>) {
  const badge = statusBadge(viewing.status);
  const border = borderColor(viewing.status);

  return (
    <div
      className={`group bg-surface-container-lowest rounded-xl p-6 flex flex-col md:flex-row items-start gap-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)] hover:shadow-[0_8px_32px_rgba(26,28,28,0.08)] transition-all duration-300 border-l-4 ${border}`}
    >
      {/* Details */}
      <div className="flex-grow min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-outline text-xs font-medium">
            •{" "}
            {viewing.type === "virtual" ? "Virtual Tour" : "In-person"}
          </span>
        </div>
        <h3 className="font-heading text-lg font-bold mb-1 text-on-surface group-hover:text-brand-primary transition-colors">
          {viewing.property_address}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-1">
              Date &amp; Time
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {formatDateShort(viewing.scheduled_at)},{" "}
              {formatTime(viewing.scheduled_at)}
            </span>
          </div>
          <div>
            <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-1">
              Type
            </span>
            <span className="text-sm font-semibold text-on-surface flex items-center gap-1">
              {viewing.type === "virtual" ? (
                <Video className="size-3.5 text-outline" strokeWidth={1.25} />
              ) : (
                <MapPin className="size-3.5 text-outline" strokeWidth={1.25} />
              )}
              {viewing.type === "virtual" ? "Virtual" : "In-person"}
            </span>
          </div>
          <div>
            <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-1">
              Agent
            </span>
            <span className="text-sm font-semibold text-on-surface flex items-center gap-1">
              <User className="size-3.5 text-outline" strokeWidth={1.25} />
              Estate Agent
            </span>
          </div>
          {viewing.notes && (
            <div>
              <span className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase block mb-1">
                Notes
              </span>
              <span className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                {viewing.notes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex md:flex-col gap-2 shrink-0">
        <Link
          href={`/dashboard/${role}/viewings/${viewing.id}/reschedule`}
          aria-label="Reschedule viewing"
        >
          <button
            className="p-3 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Reschedule viewing"
          >
            <RotateCcw className="size-5" strokeWidth={1.25} />
          </button>
        </Link>
        <button
          className="p-3 bg-surface-container-low rounded-lg hover:bg-error-container/20 hover:text-error transition-colors text-on-surface-variant"
          onClick={() => onCancel(viewing.id)}
          disabled={isCancelling}
          aria-label="Cancel viewing"
        >
          <X className="size-5" strokeWidth={1.25} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Past viewing card (Stitch grayscale grid style)
// ---------------------------------------------------------------------------

function PastViewingCard({
  viewing,
}: Readonly<{ viewing: Viewing }>) {
  const badge = statusBadge(viewing.status);
  const isCompleted = viewing.status === "completed";

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden">
      {/* Placeholder image area */}
      <div className="h-40 relative bg-surface-container-highest flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-container-lowest/40">
          <Calendar className="size-6 text-outline" strokeWidth={1.25} />
        </div>
        <div
          className={`absolute top-4 left-4 text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase ${badge.className}`}
        >
          {badge.label}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-base mb-1 text-on-surface">
          {viewing.property_address}
        </h3>
        <p className="text-on-surface-variant text-xs mb-4">
          {isCompleted ? "Visited on" : "Scheduled for"}{" "}
          {formatDateShort(viewing.scheduled_at)}
        </p>
        {isCompleted ? (
          <div className="bg-primary-container/20 text-brand-primary p-3 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-brand-primary hover:text-white transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="size-4" strokeWidth={1.25} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Leave Feedback
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-highest p-3 rounded-lg flex items-center gap-2 text-on-surface-variant">
            <X className="size-4" strokeWidth={1.25} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Cancelled
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function UpcomingSkeletons() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

function PastSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-56 rounded-xl" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ViewingsPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = use(params);
  const { data: viewings, isLoading, error } = useViewings();
  const cancelViewing = useCancelViewing();
  const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "rescheduled">("all");

  const upcoming = (viewings ?? [])
    .filter((v) => ACTIVE_STATUSES.has(v.status))
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );

  const past = (viewings ?? [])
    .filter((v) => PAST_STATUSES.has(v.status))
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    );

  const nextViewing = upcoming[0];

  const filteredUpcoming =
    filterStatus === "all"
      ? upcoming
      : upcoming.filter((v) => v.status === filterStatus);

  const handleCancel = async (viewingId: string) => {
    try {
      await cancelViewing.mutateAsync({ viewingId });
      toast.success("Viewing cancelled");
    } catch {
      toast.error("Failed to cancel viewing");
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* ── Editorial Header ─────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-on-surface mb-2">
              Viewings
            </h1>
            <p className="text-on-surface-variant font-sans max-w-2xl">
              Manage your upcoming property tours and revisit the details of
              estates you&apos;ve already experienced.
            </p>
          </div>
          <Link href={`/dashboard/${role}/viewings/book`}>
            <button
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-lg font-heading text-sm font-semibold hover:bg-brand-primary/90 transition-colors shadow-sm"
              aria-label="Book a viewing"
            >
              <Plus className="size-4" strokeWidth={1.25} />
              Book Viewing
            </button>
          </Link>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error mb-8">
          <AlertCircle className="size-4 shrink-0" strokeWidth={1.25} />
          Failed to load viewings. Please refresh the page.
        </div>
      )}

      {/* ── Bento: Calendar + Next Viewing ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-12">
        {/* Calendar card */}
        <section className="xl:col-span-8 bg-surface-container-low rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              Calendar Schedule
            </h2>
            <div className="flex items-center bg-surface-container-highest rounded-full p-1">
              <span className="px-5 py-1.5 rounded-full text-xs font-semibold bg-surface-container-lowest shadow-sm text-on-surface">
                Month
              </span>
              <span className="px-5 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant">
                Week
              </span>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 text-center mb-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase pb-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid — static layout matching Stitch */}
          <div className="grid grid-cols-7 gap-px bg-surface-container rounded-lg overflow-hidden border border-outline-variant">
            {/* Prev month days */}
            {["28", "29", "30", "31"].map((d) => (
              <div
                key={`prev-${d}`}
                className="aspect-square bg-surface-container-lowest p-2 text-xs text-outline"
              >
                {d}
              </div>
            ))}
            {/* Current month days — highlight days with viewings */}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const hasViewing =
                !isLoading &&
                upcoming.some(
                  (v) => new Date(v.scheduled_at).getDate() === d,
                );
              const isPast =
                !isLoading &&
                past.some(
                  (v) => new Date(v.scheduled_at).getDate() === d,
                );
              return (
                <div
                  key={`day-${d}`}
                  className={`aspect-square bg-surface-container-lowest p-1 text-xs font-semibold text-on-surface relative ${
                    hasViewing
                      ? "bg-primary-container/20 ring-1 ring-inset ring-brand-primary/20"
                      : isPast
                        ? "bg-surface-container-low"
                        : ""
                  }`}
                >
                  {d}
                  {hasViewing && (
                    <div className="absolute inset-x-1 bottom-1 bg-primary-container/20 text-[9px] p-0.5 rounded border-l-2 border-brand-primary text-brand-primary truncate leading-tight">
                      Viewing
                    </div>
                  )}
                </div>
              );
            })}
            {/* Fill remaining cells */}
            {Array.from({ length: 4 }, (_, i) => i + 1).map((d) => (
              <div
                key={`next-${d}`}
                className="aspect-square bg-surface-container-lowest p-2 text-xs text-outline"
              >
                {d}
              </div>
            ))}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="xl:col-span-4 space-y-4">
          {/* Next viewing card */}
          <div className="bg-brand-primary text-white p-7 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-heading text-lg font-bold mb-1">
                Next Viewing
              </h3>
              {isLoading ? (
                <div className="space-y-2 mt-3">
                  <Skeleton className="h-4 w-40 bg-white/10" />
                  <Skeleton className="h-4 w-28 bg-white/10" />
                </div>
              ) : nextViewing ? (
                <>
                  <p className="text-brand-primary-light/70 text-sm mb-5 leading-relaxed">
                    {nextViewing.property_address}
                  </p>
                  <div className="flex items-center gap-5 mb-7">
                    <div className="flex flex-col">
                      <span className="text-[0.6875rem] font-bold tracking-widest opacity-60 uppercase">
                        Date
                      </span>
                      <span className="font-semibold text-sm">
                        {formatDateShort(nextViewing.scheduled_at)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="flex flex-col">
                      <span className="text-[0.6875rem] font-bold tracking-widest opacity-60 uppercase">
                        Time
                      </span>
                      <span className="font-semibold text-sm">
                        {formatTime(nextViewing.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold py-2 px-4 rounded-md border border-white/20"
                      aria-label="Add to Google Calendar"
                    >
                      Google Cal
                    </button>
                    <button
                      className="bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold py-2 px-4 rounded-md border border-white/20"
                      aria-label="Add to Apple Calendar"
                    >
                      Apple Cal
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-brand-primary-light/70 text-sm mt-3">
                  No upcoming viewings scheduled.
                </p>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Status legend */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="font-heading text-xs font-bold tracking-widest uppercase text-outline mb-5">
              Viewing Status Keys
            </h3>
            <div className="space-y-3">
              {[
                { dot: "bg-brand-primary", label: "Confirmed" },
                { dot: "bg-secondary-fixed-dim", label: "Pending Confirmation" },
                { dot: "bg-outline", label: "Completed" },
                { dot: "bg-error", label: "Cancelled" },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-sm font-medium text-on-surface">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Scheduled Itinerary ───────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-on-surface">
              Scheduled Itinerary
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              A chronological breakdown of your upcoming tours.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["all", "confirmed", "rescheduled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filterStatus === s
                    ? "bg-brand-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
                aria-label={`Filter by ${s}`}
              >
                {s === "all" ? "All" : s === "confirmed" ? "Confirmed" : "Pending"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <UpcomingSkeletons />
        ) : filteredUpcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface-container-low py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-surface-container">
              <Calendar
                strokeWidth={1.25}
                className="size-7 text-outline"
              />
            </div>
            <div>
              <p className="font-heading font-semibold text-on-surface">
                No upcoming viewings
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Book a viewing to get started
              </p>
            </div>
            <Link href={`/dashboard/${role}/viewings/book`}>
              <button
                className="mt-2 flex items-center gap-2 px-5 py-2.5 border border-brand-primary/20 rounded-lg text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 transition-colors"
                aria-label="Book your first viewing"
              >
                <Plus className="size-4" strokeWidth={1.25} />
                Book your first viewing
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUpcoming.map((v) => (
              <UpcomingViewingCard
                key={v.id}
                viewing={v}
                role={role}
                onCancel={handleCancel}
                isCancelling={cancelViewing.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Past Viewings ──────────────────────────────────────── */}
      {(isLoading || past.length > 0) && (
        <section>
          <h2 className="font-heading text-2xl font-bold text-on-surface mb-8">
            Past Viewings
          </h2>
          {isLoading ? (
            <PastSkeletons />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((v) => (
                <PastViewingCard key={v.id} viewing={v} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
