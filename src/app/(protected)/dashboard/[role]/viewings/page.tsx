"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
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

function getRelativeDay(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return "";
}

type StatusConfig = {
  label: string;
  className: string;
};

const STATUS_CONFIG: Record<Viewing["status"], StatusConfig> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-success-light text-success border-0",
  },
  rescheduled: {
    label: "Rescheduled",
    className: "bg-warning-light text-warning border-0",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-error-light text-error border-0",
  },
  completed: {
    label: "Completed",
    className: "bg-neutral-100 text-neutral-600 border-0",
  },
};

const ACTIVE_STATUSES = new Set<Viewing["status"]>(["confirmed", "rescheduled"]);
const PAST_STATUSES = new Set<Viewing["status"]>(["completed", "cancelled"]);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ViewingCard({
  viewing,
  role,
  onCancel,
  isCancelling,
  isPast,
}: Readonly<{
  viewing: Viewing;
  role: string;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  isPast: boolean;
}>) {
  const config = STATUS_CONFIG[viewing.status];
  const relDay = getRelativeDay(viewing.scheduled_at);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:gap-6">
      {/* Date column */}
      <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-brand-primary-lighter px-4 py-3 text-center sm:w-20">
        <span className="text-xs font-medium text-brand-primary">
          {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
            new Date(viewing.scheduled_at),
          )}
        </span>
        <span className="text-2xl font-bold leading-none text-brand-primary">
          {new Date(viewing.scheduled_at).getDate()}
        </span>
        {relDay && (
          <span className="mt-0.5 text-xs font-medium text-brand-primary">
            {relDay}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">
            {viewing.property_address}
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
          >
            {config.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" strokeWidth={1.25} />
            {formatTime(viewing.scheduled_at)}
          </span>
          {viewing.type === "virtual" ? (
            <span className="flex items-center gap-1.5">
              <Video className="size-3.5" strokeWidth={1.25} />
              Virtual Tour
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" strokeWidth={1.25} />
              In Person
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" strokeWidth={1.25} />
            Estate Agent
          </span>
        </div>

        {viewing.notes && (
          <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            {viewing.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {!isPast && (
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <Link href={`/dashboard/${role}/viewings/${viewing.id}/reschedule`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              aria-label="Reschedule viewing"
            >
              <RotateCcw className="mr-1.5 size-3.5" strokeWidth={1.25} />
              Reschedule
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-neutral-500 hover:text-destructive"
            onClick={() => onCancel(viewing.id)}
            disabled={isCancelling}
            aria-label="Cancel viewing"
          >
            <X className="mr-1.5 size-3.5" strokeWidth={1.25} />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  highlight,
}: Readonly<{
  label: string;
  value: string | number;
  highlight?: boolean;
}>) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-xl px-6 py-4 ${
        highlight
          ? "bg-brand-primary text-white"
          : "bg-card text-neutral-900 shadow-sm"
      }`}
    >
      <span
        className={`text-2xl font-bold ${highlight ? "text-white" : "text-neutral-900"}`}
      >
        {value}
      </span>
      <span className={`text-xs ${highlight ? "text-white/80" : "text-neutral-500"}`}>
        {label}
      </span>
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
  const [activeTab, setActiveTab] = useState("upcoming");

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

  const handleCancel = async (viewingId: string) => {
    try {
      await cancelViewing.mutateAsync({ viewingId });
      toast.success("Viewing cancelled");
    } catch {
      toast.error("Failed to cancel viewing");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-['Plus_Jakarta_Sans']">
            Viewings Schedule
          </h1>
          <p className="text-sm text-neutral-500">
            Manage your upcoming property viewings
          </p>
        </div>
        <Link href={`/dashboard/${role}/viewings/book`}>
          <Button className="shrink-0 bg-brand-primary hover:bg-brand-primary-light">
            <Plus className="mr-2 size-4" strokeWidth={1.25} />
            Book Viewing
          </Button>
        </Link>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatPill label="Upcoming" value={upcoming.length} highlight />
            <StatPill
              label="Completed"
              value={past.filter((v) => v.status === "completed").length}
            />
            <StatPill
              label="Rescheduled"
              value={
                (viewings ?? []).filter((v) => v.status === "rescheduled").length
              }
            />
            <StatPill
              label="Next Viewing"
              value={
                nextViewing
                  ? getRelativeDay(nextViewing.scheduled_at) ||
                    formatDate(nextViewing.scheduled_at)
                  : "None"
              }
            />
          </>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-error-light px-4 py-3 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" strokeWidth={1.25} />
          Failed to load viewings. Please refresh the page.
        </div>
      )}

      {/* ── Next viewing spotlight ──────────────────────────────────── */}
      {!isLoading && nextViewing && (
        <Card className="border-0 bg-neutral-50 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Calendar strokeWidth={1.25} className="size-4 text-brand-primary" />
              Next Viewing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-neutral-900">
                  {nextViewing.property_address}
                </p>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" strokeWidth={1.25} />
                    {formatDate(nextViewing.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" strokeWidth={1.25} />
                    {formatTime(nextViewing.scheduled_at)}
                  </span>
                  {nextViewing.type === "virtual" ? (
                    <span className="flex items-center gap-1.5">
                      <Video className="size-3.5" strokeWidth={1.25} />
                      Virtual
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" strokeWidth={1.25} />
                      In Person
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/dashboard/${role}/viewings/${nextViewing.id}/reschedule`}>
                <Button variant="outline" size="sm">
                  <RotateCcw className="mr-1.5 size-3.5" strokeWidth={1.25} />
                  Reschedule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 bg-neutral-100 p-1">
          <TabsTrigger value="upcoming" className="text-sm">
            Upcoming
            {upcoming.length > 0 && (
              <span className="ml-2 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="text-sm">
            Past
            {past.length > 0 && (
              <span className="ml-2 rounded-full bg-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-700">
                {past.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
                <Calendar strokeWidth={1.25} className="size-7 text-neutral-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">No upcoming viewings</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Book a viewing to get started
                </p>
              </div>
              <Link href={`/dashboard/${role}/viewings/book`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="mr-1.5 size-4" strokeWidth={1.25} />
                  Book your first viewing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((v) => (
                <ViewingCard
                  key={v.id}
                  viewing={v}
                  role={role}
                  onCancel={handleCancel}
                  isCancelling={cancelViewing.isPending}
                  isPast={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : past.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
                <Clock strokeWidth={1.25} className="size-7 text-neutral-400" />
              </div>
              <p className="font-medium text-neutral-900">No past viewings</p>
              <p className="text-sm text-neutral-500">
                Completed and cancelled viewings will appear here
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {past.map((v) => (
                <ViewingCard
                  key={v.id}
                  viewing={v}
                  role={role}
                  onCancel={handleCancel}
                  isCancelling={cancelViewing.isPending}
                  isPast
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Calendar link ───────────────────────────────────────────── */}
      {!isLoading && upcoming.length > 0 && (
        <p className="text-center text-xs text-neutral-400">
          Add to calendar — viewings are synced automatically when booked
        </p>
      )}
    </div>
  );
}
