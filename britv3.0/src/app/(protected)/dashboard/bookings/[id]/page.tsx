"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Booking not found.</p>
      </div>
    );
  }

  // Cast booking.status to the state machine's BookingStatus type
  const currentStatus = booking.status as Parameters<typeof getValidNextStatuses>[0];
  const nextStatuses = getValidNextStatuses(currentStatus, userRole);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/dashboard/bookings" />}
      >
        <ArrowLeft className="size-4" />
        Back to Bookings
      </Button>

      {/* Booking Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{booking.booking_reference}</CardTitle>
              {booking.service_title && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.service_title}
                </p>
              )}
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Scheduled Start</p>
              <p className="font-medium">
                {new Date(booking.scheduled_start_date).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Scheduled End</p>
              <p className="font-medium">
                {new Date(booking.scheduled_end_date).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </p>
            </div>
          </div>
          {booking.cancellation_reason && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/10">
              <p className="text-xs font-medium text-red-800 dark:text-red-400">
                Cancellation reason:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {booking.cancellation_reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Reason (optional, required for some transitions)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant={
                    status === "cancelled" || status === "declined"
                      ? "destructive"
                      : "default"
                  }
                  size="sm"
                  disabled={transitioning}
                  onClick={() => handleTransition(status)}
                  className="capitalize"
                >
                  {status.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Review (completed bookings) */}
      {booking.status === "completed" && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Star className="size-5 text-brand-secondary" />
              <span className="text-sm font-medium">
                How was your experience?
              </span>
            </div>
            <Button
              size="sm"
              render={
                <Link
                  href={`/dashboard/reviews?booking=${booking.id}&provider=${booking.provider_id}`}
                />
              }
            >
              Leave a Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {booking.status_history && booking.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingTimeline
              entries={booking.status_history}
              currentStatus={booking.status}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
