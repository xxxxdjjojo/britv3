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
  confirmed: "bg-success-light text-success",
  rescheduled: "bg-warning-light text-warning",
  completed: "bg-brand-primary-lighter text-brand-primary",
  cancelled: "bg-error-light text-error",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
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
          <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-primary-dark sm:text-5xl">
            Viewings
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Manage your upcoming property visits and revisit the details of the
            viewings you&apos;ve already experienced.
          </p>
        </div>
        <Link href={`/dashboard/${role}/viewings/book`}>
          <Button>
            <Plus className="mr-2 size-4" />
            Book a Viewing
          </Button>
        </Link>
      </header>

      {/* Schedule + Next Viewing */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Schedule panel */}
        <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
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
        <div className="space-y-6">
          <div className="rounded-xl bg-brand-primary p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold">
              Next Viewing
            </p>
            {nextViewing ? (
              <>
                <p className="mt-3 text-lg font-semibold">
                  {nextViewing.property_address}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {formatDate(nextViewing.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {formatTime(nextViewing.scheduled_at)}
                  </span>
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
        <div className="rounded-xl border border-error/30 bg-error-light px-6 py-4 text-sm text-error">
          Failed to load viewings. Please refresh the page.
        </div>
      )}

      {/* Scheduled Itinerary */}
      <section className="space-y-5">
        <SectionHeader title="Scheduled Itinerary" />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
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
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
                  <Calendar className="size-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-heading font-semibold text-neutral-900">
                      {v.property_address}
                    </p>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                        "In Person"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
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
                className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-5"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={v.status} />
                  <span className="text-xs text-muted-foreground">
                    {v.type === "virtual" ? "Virtual" : "In Person"}
                  </span>
                </div>
                <p className="font-heading font-semibold text-neutral-900">
                  {v.property_address}
                </p>
                <p className="mt-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {formatDate(v.scheduled_at)}
                </p>
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
      <p className="mb-3 text-sm font-semibold text-neutral-900">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="min-h-16" />;
          }
          const events = byDay.get(day) ?? [];
          return (
            <div
              key={day}
              className="min-h-16 rounded-lg border border-border/60 p-1.5 text-left"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {events.map((v) => (
                  <span
                    key={v.id}
                    title={`${v.property_address} · ${formatTime(v.scheduled_at)}`}
                    className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium ${
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
