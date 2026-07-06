"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  RotateCcw,
  X,
  MapPin,
} from "lucide-react";
import { useViewings, useCancelViewing } from "@/hooks/useViewings";
import type { Viewing } from "@/services/viewings/viewings-service";

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

const STATUS_STYLES: Record<Viewing["status"], string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  rescheduled: "bg-warning/10 text-warning",
  completed: "bg-brand-primary/10 text-brand-primary",
  cancelled: "bg-error/10 text-error",
  declined: "bg-error/10 text-error",
};

const LEGEND: ReadonlyArray<{ label: string; dot: string }> = [
  { label: "Confirmed", dot: "bg-success" },
  { label: "Pending Confirmation", dot: "bg-warning" },
  { label: "Completed", dot: "bg-brand-primary" },
  { label: "Cancelled", dot: "bg-error" },
];

function statusLabel(status: Viewing["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StatusBadge({ status }: Readonly<{ status: Viewing["status"] }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${STATUS_STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

const ACTIVE_STATUSES = new Set<Viewing["status"]>(["confirmed", "rescheduled"]);
const PAST_STATUSES = new Set<Viewing["status"]>(["completed", "cancelled"]);

export default function ViewingsPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = use(params);
  const { data: viewings, isLoading, error } = useViewings();
  const cancelViewing = useCancelViewing();

  const upcoming = viewings?.filter((v) => ACTIVE_STATUSES.has(v.status)) ?? [];
  const past = viewings?.filter((v) => PAST_STATUSES.has(v.status)) ?? [];

  const nextViewing = upcoming.sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )[0];

  const handleCancel = async (viewingId: string) => {
    try {
      await cancelViewing.mutateAsync({ viewingId });
      toast.success("Viewing cancelled");
    } catch {
      toast.error("Failed to cancel viewing");
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Schedule &amp; Management
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Viewings
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Manage your upcoming property visits and revisit the details of the
            viewings you&apos;ve already experienced.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-sm">
            Filter
          </Button>
          <Link href={`/dashboard/${role}/viewings/book`}>
            <Button>
              <Plus className="mr-2 size-4" />
              Book a Viewing
            </Button>
          </Link>
        </div>
      </header>

      {/* Schedule + Next Viewing */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Schedule panel */}
        <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-neutral-900">
              Calendar Schedule
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {nextViewing ? formatDate(nextViewing.scheduled_at) : "—"}
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-lg" />
          ) : (
            <ScheduleCalendar viewings={upcoming} nextViewingId={nextViewing?.id} />
          )}
        </div>

        {/* Next Viewing highlight + legend */}
        <div className="space-y-5">
          {/* Next Viewing card */}
          <div className="rounded-xl bg-brand-primary p-6 text-white shadow-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-gold">
              Next Viewing
            </p>
            {nextViewing ? (
              <>
                <p className="mt-3 font-heading text-lg font-semibold leading-snug">
                  {nextViewing.property_address}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Calendar className="size-4 shrink-0" />
                    {formatDate(nextViewing.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Clock className="size-4 shrink-0" />
                    {formatTime(nextViewing.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <MapPin className="size-4 shrink-0" />
                    {nextViewing.type === "virtual" ? "Virtual" : "In Person"}
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-white text-brand-primary hover:bg-white/90"
                  >
                    Google Cal
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-white/15 text-white hover:bg-white/25"
                  >
                    Apple Cal
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-white/80">No upcoming viewings.</p>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Viewing Statuses
            </p>
            <ul className="space-y-2.5">
              {LEGEND.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 text-sm text-neutral-900"
                >
                  <span className={`size-2.5 rounded-full ${item.dot}`} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-6 py-4 text-sm text-error">
          Failed to load viewings. Please refresh the page.
        </div>
      )}

      {/* Scheduled Itinerary */}
      <section className="space-y-5">
        <SectionHeader title="Scheduled Itinerary" />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground opacity-40" />
            <p className="text-base font-medium text-neutral-900">
              No upcoming viewings
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Book a viewing to get started.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {upcoming.map((v) => (
              <li
                key={v.id}
                className="flex overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              >
                {/* Thumbnail area */}
                <div className="hidden w-32 shrink-0 items-center justify-center bg-brand-primary/8 sm:flex">
                  <div className="flex flex-col items-center gap-1.5 text-brand-primary/60">
                    <Calendar className="size-8" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      Property
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <StatusBadge status={v.status} />
                    <p className="truncate font-heading font-semibold text-neutral-900">
                      {v.property_address}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        {formatDate(v.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {formatTime(v.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {v.type === "virtual" ? (
                          <>
                            <Video className="size-3.5" />
                            Virtual
                          </>
                        ) : (
                          <>
                            <MapPin className="size-3.5" />
                            In Person
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Date badge */}
                  <div className="hidden shrink-0 flex-col items-end md:flex">
                    <span className="rounded-lg border border-border px-3 py-1.5 text-center">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
                          new Date(v.scheduled_at),
                        )}
                      </span>
                      <span className="block font-heading text-2xl font-bold leading-none text-neutral-900">
                        {new Date(v.scheduled_at).getDate()}
                      </span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Link href={`/dashboard/${role}/viewings/${v.id}/reschedule`}>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="mr-1 size-3.5" />
                        Reschedule
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(v.id)}
                      disabled={cancelViewing.isPending}
                    >
                      <X className="mr-1 size-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Past Viewings */}
      <section className="space-y-5">
        <SectionHeader title="Past Viewings" />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : past.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
            <Clock className="mx-auto mb-4 size-12 text-muted-foreground opacity-40" />
            <p className="text-base font-medium text-neutral-900">
              No past viewings
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((v) => (
              <article
                key={v.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              >
                {/* Thumbnail header */}
                <div className="flex h-28 items-center justify-center bg-brand-primary/6">
                  <div className="flex flex-col items-center gap-1.5 text-brand-primary/50">
                    <Calendar className="size-8" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      Property
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={v.status} />
                    <span className="text-xs text-muted-foreground">
                      {v.type === "virtual" ? "Virtual" : "In Person"}
                    </span>
                  </div>
                  <p className="font-heading font-semibold text-neutral-900 leading-snug">
                    {v.property_address}
                  </p>
                  <p className="mt-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {formatDate(v.scheduled_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar grid — month view with event chips for scheduled viewings.
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function ScheduleCalendar({
  viewings,
  nextViewingId,
}: Readonly<{ viewings: ReadonlyArray<Viewing>; nextViewingId?: string }>) {
  const anchor = viewings[0] ? new Date(viewings[0].scheduled_at) : new Date();
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-indexed leading blanks (0 = Mon … 6 = Sun).
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const byDay = new Map<number, Viewing[]>();
  for (const v of viewings) {
    const d = new Date(v.scheduled_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay.set(day, [...(byDay.get(day) ?? []), v]);
    }
  }

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(firstDay);

  const cells: Array<number | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <p className="mb-4 font-heading text-sm font-bold text-neutral-900">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400"
          >
            {day}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="min-h-14" />;
          }
          const events = byDay.get(day) ?? [];
          const hasEvents = events.length > 0;
          return (
            <div
              key={day}
              className={`min-h-14 rounded-lg p-1.5 text-left transition-colors ${
                hasEvents
                  ? "border border-brand-primary/20 bg-brand-primary/4"
                  : "border border-border/40"
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  hasEvents ? "text-brand-primary" : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {events.map((v) => (
                  <span
                    key={v.id}
                    title={`${v.property_address} · ${formatTime(v.scheduled_at)}`}
                    className={`block truncate rounded px-1 py-0.5 text-[10px] font-semibold ${
                      v.id === nextViewingId
                        ? "bg-brand-primary text-white"
                        : STATUS_STYLES[v.status]
                    }`}
                  >
                    {formatTime(v.scheduled_at)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
