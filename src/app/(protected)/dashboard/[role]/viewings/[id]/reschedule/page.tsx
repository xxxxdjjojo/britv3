"use client";

/**
 * Reschedule a viewing — (7.7)
 * Shows available slots for the same listing and lets the buyer pick a new time.
 * The viewingId comes from the URL [id] param.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, Clock, ArrowLeft, Video, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRescheduleViewing, useViewings } from "@/hooks/useViewings";
import type { ViewingSlot } from "@/services/viewings/viewings-service";

function formatSlotTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

export default function RescheduleViewingPage({
  params,
}: Readonly<{ params: { role: string; id: string } }>) {
  const router = useRouter();
  const { role: roleParam, id: viewingId } = params;

  const { data: viewings } = useViewings();
  const viewing = viewings?.find((v) => v.id === viewingId);

  const [slots, setSlots] = useState<ViewingSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rescheduleViewing = useRescheduleViewing();

  useEffect(() => {
    if (!viewing?.listing_id) return;

    setLoadingSlots(true);
    setSlotsError(null);

    fetch(`/api/viewings/slots?listingId=${encodeURIComponent(viewing.listing_id)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load slots");
        }
        return res.json() as Promise<ViewingSlot[]>;
      })
      .then((data) => {
        // Exclude the current slot
        setSlots(data.filter((s) => s.id !== viewing.viewing_slot_id));
      })
      .catch((err: Error) => {
        setSlotsError(err.message);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [viewing?.listing_id, viewing?.viewing_slot_id]);

  const handleReschedule = async () => {
    if (!selectedSlotId || submitting) return;

    setSubmitting(true);

    try {
      await rescheduleViewing.mutateAsync({ viewingId, newSlotId: selectedSlotId });

      const slot = slots?.find((s) => s.id === selectedSlotId);
      toast.success("Viewing rescheduled!", {
        description: slot
          ? `Your new viewing is on ${formatSlotTime(slot.start_time)}.`
          : "Your viewing has been rescheduled.",
      });

      router.push(`/dashboard/${roleParam}/viewings`);
    } catch (err) {
      const code = (err as Error & { code?: string }).code;

      if (code === "SLOT_UNAVAILABLE") {
        toast.error("Slot no longer available", {
          description: "This slot was just taken. Please choose another time.",
        });
        setSelectedSlotId(null);
        setSlots((prev) => prev?.filter((s) => s.id !== selectedSlotId) ?? prev);
      } else {
        toast.error("Reschedule failed", {
          description: (err as Error).message,
        });
      }

      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/${roleParam}/viewings`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to Viewings
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reschedule Viewing</h1>
        {viewing && (
          <p className="text-muted-foreground">
            Currently booked: {formatSlotTime(viewing.scheduled_at)} —{" "}
            {viewing.property_address}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Slots</CardTitle>
          <CardDescription>Choose a new time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingSlots && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}

          {slotsError && (
            <p className="py-8 text-center text-sm text-destructive">{slotsError}</p>
          )}

          {!loadingSlots && !slotsError && !viewing && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Viewing not found. It may have already been cancelled.
            </p>
          )}

          {!loadingSlots && !slotsError && viewing && slots?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-4 size-12 opacity-40" />
              <p className="text-base font-medium">No other slots available</p>
              <p className="mt-1 text-sm">
                There are no other times available. Please contact the agent to arrange an
                alternative.
              </p>
            </div>
          )}

          {!loadingSlots &&
            slots?.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                className={[
                  "flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
                  selectedSlotId === slot.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                ].join(" ")}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="size-4 text-muted-foreground" />
                    {formatSlotTime(slot.start_time)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {new Intl.DateTimeFormat("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(slot.start_time))}
                    &nbsp;–&nbsp;
                    {new Intl.DateTimeFormat("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(slot.end_time))}
                  </div>
                </div>
                <Badge variant="outline">
                  {slot.type === "virtual" ? (
                    <>
                      <Video className="mr-1 size-3" />
                      Virtual
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-1 size-3" />
                      In Person
                    </>
                  )}
                </Badge>
              </button>
            ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleReschedule}
          disabled={!selectedSlotId || submitting || loadingSlots}
        >
          {submitting ? "Rescheduling…" : "Confirm Reschedule"}
        </Button>
      </div>
    </div>
  );
}
