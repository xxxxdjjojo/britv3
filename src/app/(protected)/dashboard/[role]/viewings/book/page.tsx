"use client";

/**
 * Book a viewing — (7.6)
 * Fetches available slots for a listing and lets the buyer pick one.
 * Query params: listingId (required)
 */

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, Clock, ArrowLeft, Video, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookViewing } from "@/hooks/useViewings";
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

  const [slots, setSlots] = useState<ViewingSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const bookViewing = useBookViewing();

  useEffect(() => {
    if (!listingId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch loading toggle
    setLoadingSlots(true);
    setSlotsError(null);

    fetch(`/api/viewings/slots?listingId=${encodeURIComponent(listingId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load slots");
        }
        return res.json() as Promise<ViewingSlot[]>;
      })
      .then((data) => {
        setSlots(data);
      })
      .catch((err: Error) => {
        setSlotsError(err.message);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [listingId]);

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
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Back nav */}
      <div>
        <Link href={`/dashboard/${roleParam}/viewings`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="mr-2 size-4" />
            Back to Viewings
          </Button>
        </Link>
      </div>

      {/* Page heading */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Viewings Calendar
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          Book a Viewing
        </h1>
        <p className="text-sm text-muted-foreground">Select an available time slot</p>
      </div>

      {/* Slots card */}
      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="font-heading text-lg font-bold text-neutral-900">
            Available Slots
          </CardTitle>
          <CardDescription>Choose a time that works for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {loadingSlots && (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
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
            slots?.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={[
                    "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                    isSelected
                      ? "border-brand-primary bg-brand-primary/6 shadow-sm"
                      : "border-border hover:border-brand-primary/40 hover:bg-surface",
                  ].join(" ")}
                >
                  {/* Time block indicator */}
                  <div
                    className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                      isSelected
                        ? "bg-brand-primary text-white"
                        : "bg-brand-primary/8 text-brand-primary"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase leading-none tracking-wide">
                      {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
                        new Date(slot.start_time),
                      )}
                    </span>
                    <span className="block font-heading text-lg font-bold leading-none">
                      {new Date(slot.start_time).getDate()}
                    </span>
                  </div>

                  {/* Slot detail */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                      <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
                      {formatSlotTime(slot.start_time)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
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

                  {/* Type badge */}
                  <Badge
                    variant="outline"
                    className={isSelected ? "border-brand-primary/30 text-brand-primary" : ""}
                  >
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
              );
            })}
        </CardContent>
      </Card>

      {/* Confirm action */}
      <div className="flex justify-end">
        <Button
          onClick={handleBook}
          disabled={!selectedSlotId || submitting || loadingSlots}
          size="lg"
          className="min-w-36"
        >
          {submitting ? "Booking…" : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}
