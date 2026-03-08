"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import {
  providerAvailabilitySchema,
} from "@/lib/validators/marketplace-schemas";
import type { z } from "zod";

type AvailabilityFormValues = z.input<typeof providerAvailabilitySchema>;
import type { ProviderAvailability, Booking } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AvailabilityCalendarProps = Readonly<{
  unavailablePeriods?: ProviderAvailability[];
  confirmedBookings?: Pick<
    Booking,
    "id" | "booking_reference" | "scheduled_start_date" | "scheduled_end_date"
  >[];
  onAddPeriod?: (data: AvailabilityFormValues) => Promise<void>;
  onRemovePeriod?: (id: string) => Promise<void>;
}>;

function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${s.toLocaleDateString("en-GB", opts)} - ${e.toLocaleDateString("en-GB", opts)}`;
}

export function AvailabilityCalendar({
  unavailablePeriods = [],
  confirmedBookings = [],
  onAddPeriod,
  onRemovePeriod,
}: AvailabilityCalendarProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(providerAvailabilitySchema),
  });

  async function onSubmit(data: AvailabilityFormValues) {
    if (!onAddPeriod) return;
    setIsSubmitting(true);
    try {
      await onAddPeriod(data);
      toast.success("Unavailable period added");
      reset();
      setShowForm(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add period",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!onRemovePeriod) return;
    setDeletingId(id);
    try {
      await onRemovePeriod(id);
      toast.success("Period removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove period",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Confirmed Bookings */}
      {confirmedBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Confirmed Bookings
          </h3>
          {confirmedBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {booking.booking_reference}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(
                    booking.scheduled_start_date,
                    booking.scheduled_end_date,
                  )}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                Booked
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Unavailable Periods */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Unavailable Periods
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="size-3.5" />
            {showForm ? "Cancel" : "Add Period"}
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-lg border border-border p-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  aria-invalid={!!errors.start_date}
                />
                {errors.start_date && (
                  <p className="text-xs text-destructive">
                    {errors.start_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  aria-invalid={!!errors.end_date}
                />
                {errors.end_date && (
                  <p className="text-xs text-destructive">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g. Holiday, personal leave"
                {...register("reason")}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? "Adding..." : "Add Unavailable Period"}
            </Button>
          </form>
        )}

        {/* Existing Periods */}
        {unavailablePeriods.length === 0 && !showForm ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
            <CalendarOff className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No unavailable periods set. You are available for bookings on all
              dates.
            </p>
          </div>
        ) : (
          unavailablePeriods.map((period) => (
            <div
              key={period.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border p-3",
                deletingId === period.id && "opacity-50",
              )}
            >
              <CalendarOff className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {formatDateRange(period.start_date, period.end_date)}
                </p>
                {period.reason && (
                  <p className="text-xs text-muted-foreground">
                    {period.reason}
                  </p>
                )}
              </div>
              {onRemovePeriod && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRemove(period.id)}
                  disabled={deletingId === period.id}
                  aria-label="Remove period"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
