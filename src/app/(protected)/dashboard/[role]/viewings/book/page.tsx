"use client";

/**
 * Book a viewing — (7.6)
 * Fetches available slots for a listing and lets the buyer pick one.
 * Query params: listingId (required)
 */

import { useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, ArrowLeft, Video, MapPin } from "lucide-react";
import { generateIcs, downloadIcs } from "@/lib/ics-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBookViewing, useViewings } from "@/hooks/useViewings";
import { hasViewingConflict } from "@/lib/viewing-conflict";
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

export default function BookViewingPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role: roleParam } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  const {
    data: slots = null,
    isLoading: loadingSlots,
    error: slotsQueryError,
  } = useQuery<ViewingSlot[]>({
    queryKey: ["viewing-slots", listingId],
    enabled: !!listingId,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/viewings/slots?listingId=${encodeURIComponent(listingId!)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load slots");
      }
      return res.json() as Promise<ViewingSlot[]>;
    },
  });
  const slotsError = slotsQueryError instanceof Error ? slotsQueryError.message : null;

  const bookViewing = useBookViewing();
  const { data: existingViewings } = useViewings();

  // Check for conflict whenever the selected slot changes
  const selectedSlot = slots?.find((s) => s.id === selectedSlotId);
  const conflictCheck = selectedSlot && existingViewings
    ? hasViewingConflict(
        existingViewings.map((v) => ({ start_time: v.scheduled_at, status: v.status })),
        selectedSlot.start_time,
      )
    : { conflict: false };

  const handleBook = async () => {
    if (!selectedSlotId || !listingId || submitting) return;

    const slot = slots?.find((s) => s.id === selectedSlotId);
    if (!slot) return;

    setSubmitting(true);

    const failedSlotId = selectedSlotId; // capture before any async state changes

    try {
      await bookViewing.mutateAsync({
        viewingSlotId: selectedSlotId,
        listingId,
        type: slot.type,
      });

      toast.success("Viewing booked!", {
        description: `Your viewing on ${formatSlotTime(slot.start_time)} is confirmed.`,
        action: {
          label: "Add to Calendar",
          onClick: () => {
            const ics = generateIcs({
              title: "Property Viewing — Britestate",
              location: slot.type === "virtual" ? "Virtual viewing" : "See listing for address",
              description: `Viewing arranged via Britestate. Listing: ${listingId}`,
              start: new Date(slot.start_time),
              end: new Date(slot.end_time),
            });
            downloadIcs(ics, "britestate-viewing.ics");
          },
        },
      });

      setSubmitting(false);
      router.push(`/dashboard/${roleParam}/viewings`);
    } catch (err) {
      const code = (err as Error & { code?: string }).code;

      if (code === "SLOT_UNAVAILABLE") {
        toast.error("Slot no longer available", {
          description: "This slot was just taken. Please choose another time.",
        });
        // Refresh slots
        setSelectedSlotId(null);
        setSlots((prev) => prev?.filter((s) => s.id !== failedSlotId) ?? prev);
      } else {
        toast.error("Booking failed", {
          description: (err as Error).message,
        });
      }

      setSubmitting(false);
    }
  };

  if (!listingId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/${roleParam}/viewings`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No listing specified. Please return to search and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold tracking-tight">Book a Viewing</h1>
        <p className="text-muted-foreground">Select an available time slot</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Slots</CardTitle>
          <CardDescription>Choose a time that works for you</CardDescription>
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

          {!loadingSlots && !slotsError && slots?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-4 size-12 opacity-40" />
              <p className="text-base font-medium">No slots available</p>
              <p className="mt-1 text-sm">
                There are no viewing times available for this property right now. Please check
                back later or contact the agent.
              </p>
            </div>
          )}

          {!loadingSlots &&
            slots?.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  setSelectedSlotId(slot.id);
                  setConflictAcknowledged(false);
                }}
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

      {conflictCheck.conflict && selectedSlot && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-800">
          <AlertDescription className="space-y-2">
            <p>
              This slot is within 60 minutes of another viewing you have at{" "}
              <strong>{formatSlotTime(conflictCheck.conflictWith!)}</strong>.
              You may not have enough travel time between viewings.
            </p>
            {!conflictAcknowledged && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConflictAcknowledged(true)}
              >
                I understand, proceed anyway
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleBook}
          disabled={
            !selectedSlotId ||
            submitting ||
            loadingSlots ||
            (conflictCheck.conflict && !conflictAcknowledged)
          }
        >
          {submitting ? "Booking…" : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}
