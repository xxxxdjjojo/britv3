"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AvailabilityCalendar } from "@/components/provider/AvailabilityCalendar";
import type { ProviderAvailability, Booking } from "@/types/marketplace";

type ConfirmedBookingSlim = Pick<
  Booking,
  "id" | "booking_reference" | "scheduled_start_date" | "scheduled_end_date"
>;

export default function ProviderAvailabilityPage() {
  const [periods, setPeriods] = useState<ProviderAvailability[]>([]);
  const [bookings, setBookings] = useState<ConfirmedBookingSlim[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [periodsRes, bookingsRes] = await Promise.all([
        fetch("/api/providers/availability"),
        fetch("/api/bookings/list?status=confirmed"),
      ]);

      if (periodsRes.ok) {
        const data = await periodsRes.json();
        setPeriods(data.periods ?? data ?? []);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings ?? data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddPeriod(data: {
    start_date: unknown;
    end_date: unknown;
    reason?: string;
  }) {
    const res = await fetch("/api/providers/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error ?? "Failed to add period");
    }
    await fetchData();
  }

  async function handleRemovePeriod(id: string) {
    const res = await fetch(`/api/providers/availability/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to remove period");
    }
    await fetchData();
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Availability</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage Your Availability</CardTitle>
          <CardDescription>
            Mark dates when you are unavailable for bookings. Confirmed bookings
            are shown for reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar
            unavailablePeriods={periods}
            confirmedBookings={bookings}
            onAddPeriod={handleAddPeriod}
            onRemovePeriod={handleRemovePeriod}
          />
        </CardContent>
      </Card>
    </div>
  );
}
