"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import {
  getValidNextStatuses,
  type TransitionActor,
} from "@/lib/marketplace/booking-state-machine";
import type {
  Booking,
  BookingStatusHistory,
  BookingStatus,
} from "@/types/marketplace";

type PageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

type BookingDetail = Booking & {
  status_history: BookingStatusHistory[];
  service_title?: string;
  provider_name?: string;
  user_name?: string;
};

export default function BookingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [reason, setReason] = useState("");
  const [userRole, setUserRole] = useState<TransitionActor>("user");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
          // Determine user role (provider vs user) based on response
          if (data._viewer_role) {
            setUserRole(data._viewer_role as TransitionActor);
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleTransition(newStatus: string) {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Failed (${res.status})`);
      }

      toast.success(`Booking ${newStatus.replace(/_/g, " ")}`);
      // Reload booking
      const updated = await fetch(`/api/bookings/${id}`);
      if (updated.ok) setBooking(await updated.json());
      setReason("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setTransitioning(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center font-body text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-12 text-center">
        <p className="font-body text-sm text-neutral-500">Booking not found.</p>
      </div>
    );
  }

  // Cast booking.status to the state machine's BookingStatus type
  const currentStatus = booking.status as Parameters<typeof getValidNextStatuses>[0];
  const nextStatuses = getValidNextStatuses(currentStatus, userRole);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 font-body text-sm text-neutral-500 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Bookings
      </Link>

      {/* Booking Info */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-semibold text-foreground">
                {booking.booking_reference}
              </h1>
              {booking.service_title && (
                <p className="mt-1 font-body text-sm text-neutral-500">
                  {booking.service_title}
                </p>
              )}
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-body text-xs text-neutral-500">Scheduled Start</p>
              <p className="font-body text-sm font-medium text-foreground">
                {new Date(booking.scheduled_start_date).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </p>
            </div>
            <div>
              <p className="font-body text-xs text-neutral-500">Scheduled End</p>
              <p className="font-body text-sm font-medium text-foreground">
                {new Date(booking.scheduled_end_date).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </p>
            </div>
          </div>
          {booking.cancellation_reason && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/10 p-4 ring-1 ring-red-200/60 dark:ring-red-700/60">
              <p className="font-body text-xs font-medium text-red-800 dark:text-red-400">
                Cancellation reason:
              </p>
              <p className="font-body text-sm text-red-700 dark:text-red-300">
                {booking.cancellation_reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-foreground">Actions</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <Textarea
              placeholder="Reason (optional, required for some transitions)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  disabled={transitioning}
                  onClick={() => handleTransition(status)}
                  className={
                    status === "cancelled" || status === "declined"
                      ? "rounded-lg bg-destructive px-3 py-1.5 font-body text-sm font-medium capitalize text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                      : "rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium capitalize text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                  }
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave Review (completed bookings) */}
      {booking.status === "completed" && (
        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="size-5 text-brand-secondary" />
              <span className="font-body text-sm font-medium text-foreground">
                How was your experience?
              </span>
            </div>
            <Link
              href={`/dashboard/reviews?booking=${booking.id}&provider=${booking.provider_id}`}
              className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
            >
              Leave a Review
            </Link>
          </div>
        </div>
      )}

      {/* Timeline */}
      {booking.status_history && booking.status_history.length > 0 && (
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-foreground">Timeline</h2>
          </div>
          <div className="px-6 py-4">
            <BookingTimeline
              entries={booking.status_history}
              currentStatus={booking.status}
            />
          </div>
        </div>
      )}
    </div>
  );
}
