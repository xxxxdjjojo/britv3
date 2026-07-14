"use client";

import { useState } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import "react-day-picker/style.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Clock, Home } from "lucide-react";
import type { AgentViewingSlot } from "@/types/agent";

type ViewMode = "month" | "week" | "day";

type ManageableListing = { id: string; label: string };

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day === 0 ? 7 : day) - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Calendar day cell with at-a-glance indicator dots: blue when the day has a
 * booked viewing, green when it has an available slot (both can show together).
 */
function CalendarDayButton({
  day,
  modifiers,
  children,
  className,
  ...buttonProps
}: DayButtonProps) {
  const hasBooked = Boolean(modifiers.booked);
  const hasAvailable = Boolean(modifiers.available);
  return (
    <button {...buttonProps} className={cn("relative", className)}>
      {children ?? day.date.getDate()}
      {(hasBooked || hasAvailable) && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0.5 flex justify-center gap-0.5"
        >
          {hasBooked && (
            <span
              data-testid="viewing-dot-booked"
              className="size-1.5 rounded-full bg-blue-500"
            />
          )}
          {hasAvailable && (
            <span
              data-testid="viewing-dot-available"
              className="size-1.5 rounded-full bg-green-500"
            />
          )}
        </span>
      )}
    </button>
  );
}

function SlotBadge({ slot }: Readonly<{ slot: AgentViewingSlot }>) {
  return (
    <div
      className={`rounded-md px-2 py-1 text-xs ${
        slot.is_booked
          ? "bg-blue-100 text-blue-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      <span className="font-medium">{formatTime(slot.start_time)}</span>
      {" — "}
      <span className="truncate">{slot.is_booked ? "Booked" : "Available"}</span>
      {slot.is_booked && slot.booked_by_name && (
        <span className="ml-1 text-muted-foreground">
          {slot.booked_by_name}
        </span>
      )}
    </div>
  );
}

function PublishAvailabilityDialog({
  manageableListings,
}: Readonly<{ manageableListings: ManageableListing[] }>) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    property_id: "",
    date: "",
    start_time: "",
    end_time: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.property_id || !form.date || !form.start_time || !form.end_time) {
      toast.error("Please fill in all fields");
      return;
    }

    const startIso = `${form.date}T${form.start_time}:00`;
    const endIso = `${form.date}T${form.end_time}:00`;

    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: form.property_id,
          start_time: startIso,
          end_time: endIso,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to publish slot");
      }

      toast.success("Viewing slot published");
      setOpen(false);
      setForm({ property_id: "", date: "", start_time: "", end_time: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish slot");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Publish Availability
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Viewing Availability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="property_id">Property</Label>
            {manageableListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no listings to publish availability for. Ask the
                property owner to add you as their agent, or list a property
                first.
              </p>
            ) : (
              <Select
                value={form.property_id}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, property_id: value ?? "" }))
                }
              >
                <SelectTrigger id="property_id" className="w-full">
                  <SelectValue placeholder="Select a property…" />
                </SelectTrigger>
                <SelectContent>
                  {manageableListings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="slot_date">Date</Label>
            <Input
              id="slot_date"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start_time">Start time</Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_time">End time</Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_time: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || manageableListings.length === 0}
            >
              {submitting ? "Publishing..." : "Publish Slot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DaySlotList({
  slots,
  date,
}: Readonly<{ slots: AgentViewingSlot[]; date: Date }>) {
  const daySlots = slots.filter((s) => isSameDay(new Date(s.start_time), date));

  if (daySlots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No slots for this day.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {daySlots.map((slot) => (
        <div
          key={slot.id}
          className="flex items-start gap-3 rounded-lg border p-3"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </span>
              <Badge
                variant={slot.is_booked ? "default" : "outline"}
                className={
                  slot.is_booked
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    : "bg-green-50 text-green-700"
                }
              >
                {slot.is_booked ? "Booked" : "Available"}
              </Badge>
            </div>
            {slot.is_booked && slot.booked_by_name && (
              <p className="text-xs text-muted-foreground">
                Buyer: {slot.booked_by_name}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Home className="size-3" />
              <span className="truncate">
                {slot.property_label ?? slot.property_id}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekView({
  slots,
  selectedDate,
  onSelectDate,
}: Readonly<{
  slots: AgentViewingSlot[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}>) {
  const weekDays = getWeekDays(selectedDate);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="grid grid-cols-7 gap-2 overflow-x-auto">
      {weekDays.map((day, i) => {
        const daySlots = slots.filter((s) =>
          isSameDay(new Date(s.start_time), day),
        );
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={day.toISOString()}
            className={`min-h-24 cursor-pointer rounded-lg border p-2 transition-colors ${
              isSelected
                ? "border-brand-primary bg-brand-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onSelectDate(day)}
          >
            <div className="mb-1 text-center">
              <p className="text-xs text-muted-foreground">{dayNames[i]}</p>
              <p
                className={`text-sm font-medium ${
                  isToday ? "text-brand-primary" : ""
                }`}
              >
                {day.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {daySlots.map((slot) => (
                <SlotBadge key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ViewingCalendar({
  initialSlots,
  manageableListings = [],
}: Readonly<{
  initialSlots: AgentViewingSlot[];
  manageableListings?: ManageableListing[];
}>) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots] = useState<AgentViewingSlot[]>(initialSlots);

  const bookedDays = slots
    .filter((s) => s.is_booked)
    .map((s) => new Date(s.start_time));
  const availableDays = slots
    .filter((s) => !s.is_booked)
    .map((s) => new Date(s.start_time));

  function handlePrev() {
    const d = new Date(selectedDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  }

  function handleNext() {
    const d = new Date(selectedDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  }

  const viewLabel =
    viewMode === "month"
      ? selectedDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })
      : viewMode === "week"
        ? `Week of ${getWeekDays(selectedDate)[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
        : selectedDate.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">
            {viewLabel}
          </span>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors first:rounded-l-md last:rounded-r-md ${
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <PublishAvailabilityDialog manageableListings={manageableListings} />
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "month" && (
        <Card>
          <CardContent className="flex flex-col items-center pt-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={selectedDate}
              onMonthChange={setSelectedDate}
              modifiers={{
                booked: bookedDays,
                available: availableDays,
              }}
              components={{ DayButton: CalendarDayButton }}
            />
            {/* Legend */}
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-blue-500" />
                Booked
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-full bg-green-500" />
                Available
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "week" && (
        <Card>
          <CardContent className="pt-4">
            <WeekView
              slots={slots}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </CardContent>
        </Card>
      )}

      {/* Day view / slots list for selected date */}
      {(viewMode === "day" || viewMode === "month") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {viewMode === "day"
                ? "Slots for today"
                : `Slots for ${selectedDate.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DaySlotList slots={slots} date={selectedDate} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
