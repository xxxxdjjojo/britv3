"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Info, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewingSlot = {
  id: string;
  starts_at: string; // ISO timestamp
  ends_at: string;   // ISO timestamp
};

type SlotsResponse = {
  slots: ViewingSlot[];
};

type BookingResponse = {
  success?: boolean;
  error?: string;
  viewingId?: string;
};

type SlotStatus = "idle" | "loading" | "success" | "slot_taken" | "session_expired" | "error";

type Props = Readonly<{
  propertyId: string;
  propertyStatus: string;
  existingViewingId?: string | null;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSlot(slot: ViewingSlot): string {
  const start = new Date(slot.starts_at);
  const end = new Date(slot.ends_at);

  const date = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const startTime = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return `${date} · ${startTime}–${endTime}`;
}

// ---------------------------------------------------------------------------
// BookViewingModal
// ---------------------------------------------------------------------------

export function BookViewingModal({ propertyId, propertyStatus, existingViewingId }: Props) {
  // Defensive status gate — parent should also gate, but we guard here too
  if (
    propertyStatus === "sold" ||
    propertyStatus === "archived" ||
    propertyStatus === "draft"
  ) {
    return null;
  }

  return (
    <BookViewingModalInner
      propertyId={propertyId}
      propertyStatus={propertyStatus}
      existingViewingId={existingViewingId ?? null}
    />
  );
}

// ---------------------------------------------------------------------------
// Inner component (avoids early return before hook calls)
// ---------------------------------------------------------------------------

function BookViewingModalInner({
  propertyId,
  propertyStatus,
  existingViewingId,
}: {
  propertyId: string;
  propertyStatus: string;
  existingViewingId: string | null;
}) {
  const [slots, setSlots] = useState<ViewingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<SlotStatus>("idle");
  const [bookedViewingId, setBookedViewingId] = useState<string | null>(null);

  const isSoldStc = propertyStatus === "sold_stc";
  const isUnderOffer = propertyStatus === "under_offer";

  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/viewing-slots`);
      if (!res.ok) {
        setSlotsError("Could not load available slots. Please try again.");
        return;
      }
      const data = (await res.json()) as SlotsResponse;
      setSlots(data.slots ?? []);
    } catch {
      setSlotsError("Could not load available slots. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (!existingViewingId && !isSoldStc) {
      void fetchSlots();
    }
  }, [existingViewingId, isSoldStc, fetchSlots]);

  const handleBook = async () => {
    if (!selectedSlotId) return;

    setBookingStatus("loading");

    try {
      const res = await fetch(`/api/properties/${propertyId}/book-viewing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlotId }),
      });

      if (res.status === 401) {
        setBookingStatus("session_expired");
        return;
      }

      if (res.status === 409) {
        // G3: slot taken concurrently — refresh available slots
        setBookingStatus("slot_taken");
        setSelectedSlotId(null);
        void fetchSlots();
        return;
      }

      if (!res.ok) {
        setBookingStatus("error");
        return;
      }

      const data = (await res.json()) as BookingResponse;
      if (data.error === "slot_taken") {
        setBookingStatus("slot_taken");
        setSelectedSlotId(null);
        void fetchSlots();
        return;
      }

      setBookedViewingId(data.viewingId ?? null);
      setBookingStatus("success");
    } catch {
      setBookingStatus("error");
    }
  };

  // -------------------------------------------------------------------
  // Already has a viewing booked
  // -------------------------------------------------------------------
  if (existingViewingId) {
    return (
      <div className="rounded-xl border border-[#1B4D3E]/20 bg-[#1B4D3E]/5 p-4 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-[#1B4D3E] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1B4D3E]">
            You have a viewing booked for this property
          </p>
          <a
            href={`/dashboard/viewings/${existingViewingId}`}
            className="text-xs text-[#2563EB] hover:underline mt-1 inline-block"
          >
            View your booking details
          </a>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Sold STC
  // -------------------------------------------------------------------
  if (isSoldStc) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          This property is <strong>Sold STC</strong> — viewings are no longer available.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------
  if (bookingStatus === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-8 text-green-600" />
        <p className="font-semibold text-green-800">Viewing booked!</p>
        <p className="text-sm text-green-700">
          We&apos;ve confirmed your viewing. You&apos;ll receive an email confirmation shortly.
        </p>
        {bookedViewingId && (
          <a
            href={`/dashboard/viewings/${bookedViewingId}`}
            className="text-xs text-[#2563EB] hover:underline"
          >
            View your booking details
          </a>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Booking form
  // -------------------------------------------------------------------
  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarDays className="size-5 text-[#1B4D3E] shrink-0" />
        <h3 className="font-semibold text-base text-foreground">Book a Viewing</h3>
      </div>

      {/* Under offer banner */}
      {isUnderOffer && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2">
          <Info className="size-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">
            Under Offer — this property is currently under offer. You may still request a viewing.
          </p>
        </div>
      )}

      {/* Status messages */}
      {bookingStatus === "slot_taken" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            That slot was just taken — please pick another.
          </p>
        </div>
      )}

      {bookingStatus === "session_expired" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="size-4 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-orange-700 mb-2">
              Your session expired — please sign in again.
            </p>
            <a
              href="/auth/login"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline"
            >
              <LogIn className="size-3" />
              Sign in
            </a>
          </div>
        </div>
      )}

      {bookingStatus === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Something went wrong. Please try again.
          </p>
        </div>
      )}

      {/* Slots */}
      {slotsLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading available slots…</span>
        </div>
      ) : slotsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-700">{slotsError}</p>
          <button
            onClick={() => void fetchSlots()}
            className="text-xs text-[#2563EB] hover:underline mt-1"
          >
            Retry
          </button>
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No viewing slots currently available. Check back soon.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Select a time
          </p>
          <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {slots.map((slot) => (
              <li key={slot.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setBookingStatus("idle");
                  }}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    "flex items-center gap-2",
                    selectedSlotId === slot.id
                      ? "border-[#1B4D3E] bg-[#1B4D3E]/5 text-[#1B4D3E] font-medium"
                      : "border-border hover:border-[#1B4D3E]/40 hover:bg-[#1B4D3E]/5 text-foreground",
                    isUnderOffer && "opacity-70",
                  )}
                  aria-pressed={selectedSlotId === slot.id}
                >
                  <Clock className="size-4 shrink-0 text-current opacity-70" />
                  {formatSlot(slot)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full bg-[#1B4D3E] hover:bg-[#1B4D3E]/90 text-white gap-2"
        disabled={
          !selectedSlotId ||
          bookingStatus === "loading" ||
          bookingStatus === "session_expired" ||
          slotsLoading
        }
        onClick={() => void handleBook()}
      >
        {bookingStatus === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Booking…
          </>
        ) : (
          <>
            <CalendarDays className="size-4" />
            {isUnderOffer ? "Request a Viewing" : "Book Viewing"}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Free to book. No obligation.
      </p>
    </div>
  );
}
