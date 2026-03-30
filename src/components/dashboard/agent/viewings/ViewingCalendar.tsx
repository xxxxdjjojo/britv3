"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Home,
  CalendarDays,
} from "lucide-react";
import type { AgentViewingSlot } from "@/types/agent";

type ViewMode = "month" | "week" | "day";

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

function SlotPill({ slot }: Readonly<{ slot: AgentViewingSlot }>) {
  return (
    <div
      className={`rounded-lg px-2 py-1 text-[10px] font-semibold leading-tight ${
        slot.is_booked
          ? "bg-info-light text-info"
          : "bg-success-light text-success"
      }`}
    >
      <span>{formatTime(slot.start_time)}</span>
      {" — "}
      <span className="truncate">
        {slot.is_booked ? (slot.booked_by ?? "Booked") : "Available"}
      </span>
    </div>
  );
}

function PublishAvailabilityDialog() {
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
      toast.error(
        err instanceof Error ? err.message : "Failed to publish slot",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          <Plus className="mr-1.5 size-4" />
          Publish Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
            Publish Viewing Availability
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="property_id"
              className="text-sm font-medium text-neutral-700"
            >
              Property ID
            </Label>
            <Input
              id="property_id"
              value={form.property_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, property_id: e.target.value }))
              }
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="rounded-lg bg-neutral-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="slot_date"
              className="text-sm font-medium text-neutral-700"
            >
              Date
            </Label>
            <Input
              id="slot_date"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              className="rounded-lg bg-neutral-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="start_time"
                className="text-sm font-medium text-neutral-700"
              >
                Start time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_time: e.target.value }))
                }
                className="rounded-lg bg-neutral-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="end_time"
                className="text-sm font-medium text-neutral-700"
              >
                End time
              </Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_time: e.target.value }))
                }
                className="rounded-lg bg-neutral-50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {submitting ? "Publishing…" : "Publish Slot"}
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
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CalendarDays className="mb-3 size-8 text-neutral-300" />
        <p className="text-sm text-neutral-400">No slots for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {daySlots.map((slot) => (
        <div
          key={slot.id}
          className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
            slot.is_booked ? "bg-info-light/30" : "bg-success-light/30"
          }`}
        >
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              slot.is_booked ? "bg-info-light" : "bg-success-light"
            }`}
          >
            <Clock
              className={`size-4 ${slot.is_booked ? "text-info" : "text-success"}`}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-neutral-800">
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  slot.is_booked
                    ? "bg-info-light text-info"
                    : "bg-success-light text-success"
                }`}
              >
                {slot.is_booked ? "Booked" : "Available"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Home className="size-3" />
              <span className="truncate">{slot.property_id}</span>
            </div>
            {slot.is_booked && slot.booked_by && (
              <p className="text-xs text-neutral-500">Buyer: {slot.booked_by}</p>
            )}
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
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, i) => {
        const daySlots = slots.filter((s) =>
          isSameDay(new Date(s.start_time), day),
        );
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={day.toISOString()}
            className={`min-h-24 cursor-pointer rounded-xl p-2 transition-all ${
              isSelected
                ? "bg-brand-primary-lighter ring-2 ring-brand-primary/40"
                : "bg-neutral-50 hover:bg-neutral-100"
            }`}
            onClick={() => onSelectDate(day)}
          >
            <div className="mb-2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                {dayNames[i]}
              </p>
              <p
                className={`mt-0.5 text-sm font-bold ${
                  isToday
                    ? "flex size-6 items-center justify-center rounded-full bg-brand-primary text-white mx-auto"
                    : "text-neutral-800"
                }`}
              >
                {day.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {daySlots.map((slot) => (
                <SlotPill key={slot.id} slot={slot} />
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
}: Readonly<{ initialSlots: AgentViewingSlot[] }>) {
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
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            onClick={handlePrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-semibold text-neutral-800">
            {viewLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            onClick={handleNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl bg-neutral-100">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? "bg-brand-primary text-white"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <PublishAvailabilityDialog />
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "month" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col items-center px-4 py-4">
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
              modifiersClassNames={{
                booked: "rdp-day-booked",
                available: "rdp-day-available",
              }}
              styles={{}}
            />
            {/* Legend */}
            <div className="mt-3 flex items-center gap-5 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full bg-info" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full bg-success" />
                Available
              </span>
            </div>
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
          <WeekView
            slots={slots}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      )}

      {/* Day / selected-date slot list */}
      {(viewMode === "day" || viewMode === "month") && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-neutral-50 px-5 py-4">
            <p className="font-semibold text-neutral-900">
              {viewMode === "day"
                ? "Today's slots"
                : `Slots for ${selectedDate.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}`}
            </p>
          </div>
          <div className="p-4">
            <DaySlotList slots={slots} date={selectedDate} />
          </div>
        </div>
      )}
    </div>
  );
}
