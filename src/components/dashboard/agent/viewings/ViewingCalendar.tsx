"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { AgentViewingSlot } from "@/types/agent";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDay(dateStr: string, year: number, month: number, day: number): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday-based day of week (0=Mon, 6=Sun) */
function getStartDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

/** Build a new ISO start_time string preserving original time-of-day on a new calendar date */
function buildNewSlotTime(originalIso: string, targetYear: number, targetMonth: number, targetDay: number): string {
  const orig = new Date(originalIso);
  const next = new Date(targetYear, targetMonth, targetDay, orig.getHours(), orig.getMinutes(), orig.getSeconds());
  return next.toISOString();
}

// ---------------------------------------------------------------------------
// Toast — lightweight inline banner
// ---------------------------------------------------------------------------

type ToastState = { message: string; kind: "error" | "success" } | null;

// ---------------------------------------------------------------------------
// Draggable viewing card
// ---------------------------------------------------------------------------

function DraggableViewingCard(
  props: Readonly<{
    slot: AgentViewingSlot;
    isDragOverlay?: boolean;
  }>,
) {
  const { slot, isDragOverlay } = props;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: slot.id,
    data: { slot },
    disabled: slot.is_booked,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={[
        "flex items-center justify-between rounded border px-3 py-2 transition-opacity",
        slot.is_booked
          ? "cursor-default opacity-75"
          : "cursor-grab active:cursor-grabbing",
        isDragging && !isDragOverlay ? "opacity-30" : "",
        isDragOverlay ? "rotate-1 shadow-lg bg-white dark:bg-gray-900" : "",
      ].join(" ")}
    >
      <div>
        <p className="text-sm font-medium">
          Property: {slot.property_id.slice(0, 8)}...
        </p>
        <p className="text-xs text-gray-500">
          {formatTime(slot.start_time)} &ndash; {formatTime(slot.end_time)}
          {slot.notes && ` | ${slot.notes}`}
        </p>
      </div>
      <span
        className={[
          "rounded-full px-2 py-0.5 text-xs font-medium",
          slot.is_booked
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600",
        ].join(" ")}
      >
        {slot.is_booked ? "Booked" : "Available"}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Droppable calendar day cell
// ---------------------------------------------------------------------------

function DroppableDay(
  props: Readonly<{
    day: number | null;
    isSelected: boolean;
    isToday: boolean;
    viewingsCount: number;
    onClick: () => void;
  }>,
) {
  const { day, isSelected, isToday, viewingsCount, onClick } = props;

  // Only real days are droppable targets
  const droppableId = day !== null ? `day-${day}` : `empty-placeholder`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    disabled: day === null,
  });

  return (
    <div
      ref={setNodeRef}
      role={day ? "button" : undefined}
      tabIndex={day ? 0 : undefined}
      onClick={() => day && onClick()}
      onKeyDown={(e) => {
        if (day && (e.key === "Enter" || e.key === " ")) onClick();
      }}
      className={[
        "flex min-h-[64px] flex-col items-center border-b border-r p-2 text-sm transition-colors",
        day ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950" : "",
        isSelected ? "bg-blue-100 dark:bg-blue-900" : "",
        isToday && !isSelected ? "bg-amber-50 dark:bg-amber-950" : "",
        isOver && day ? "ring-2 ring-inset ring-blue-400 bg-blue-50 dark:bg-blue-950" : "",
      ].join(" ")}
    >
      {day && (
        <>
          <span
            className={[
              "text-sm",
              isToday ? "font-bold text-blue-600" : "",
            ].join(" ")}
          >
            {day}
          </span>
          {viewingsCount > 0 && (
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: Math.min(viewingsCount, 4) }).map(
                (_, i) => (
                  <span
                    key={i}
                    className="inline-block size-1.5 rounded-full bg-blue-500"
                  />
                ),
              )}
              {viewingsCount > 4 && (
                <span className="text-[10px] text-blue-500">
                  +{viewingsCount - 4}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main calendar component
// ---------------------------------------------------------------------------

export function ViewingCalendar(
  props: Readonly<{ initialSlots: AgentViewingSlot[] }>,
) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [slots, setSlots] = useState<AgentViewingSlot[]>(props.initialSlots);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [activeSlot, setActiveSlot] = useState<AgentViewingSlot | null>(null);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);
  const monthName = new Date(year, month).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function showToast(message: string, kind: "error" | "success") {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 4000);
  }

  function goToPrevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  }

  function getViewingsForDay(day: number): AgentViewingSlot[] {
    return slots.filter((s) => isSameDay(s.start_time, year, month, day));
  }

  const selectedViewings = selectedDay ? getViewingsForDay(selectedDay) : [];

  // -------------------------------------------------------------------------
  // Drag handlers
  // -------------------------------------------------------------------------

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const slot = slots.find((s) => s.id === event.active.id);
      setActiveSlot(slot ?? null);
    },
    [slots],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveSlot(null);
      const { active, over } = event;
      if (!over) return;

      // over.id is "day-{N}" for calendar cells
      const overId = over.id as string;
      if (!overId.startsWith("day-")) return;

      const targetDay = parseInt(overId.slice(4), 10);
      if (isNaN(targetDay)) return;

      const draggedSlot = slots.find((s) => s.id === active.id);
      if (!draggedSlot) return;

      // Already on this day — no-op
      const draggedDate = new Date(draggedSlot.start_time);
      if (
        draggedDate.getFullYear() === year &&
        draggedDate.getMonth() === month &&
        draggedDate.getDate() === targetDay
      ) {
        return;
      }

      // Check target day has no booked slot conflicting (spec: only update if target slot is_booked = false)
      const targetViewings = getViewingsForDay(targetDay);
      const hasBookedConflict = targetViewings.some((s) => s.is_booked);
      if (hasBookedConflict) {
        showToast("Cannot reschedule to a day with an existing booked viewing.", "error");
        return;
      }

      const newSlotTime = buildNewSlotTime(draggedSlot.start_time, year, month, targetDay);

      // Compute duration to preserve end_time offset
      const durationMs =
        new Date(draggedSlot.end_time).getTime() -
        new Date(draggedSlot.start_time).getTime();
      const newEndTime = new Date(new Date(newSlotTime).getTime() + durationMs).toISOString();

      // Optimistic update
      const prevSlots = slots;
      setSlots((prev) =>
        prev.map((s) =>
          s.id === draggedSlot.id
            ? { ...s, start_time: newSlotTime, end_time: newEndTime }
            : s,
        ),
      );

      // If selected day was the source, keep it selected; move to target day
      setSelectedDay(targetDay);

      // Persist via API
      try {
        const res = await fetch("/api/agent/viewings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viewingId: draggedSlot.id,
            newSlotTime,
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to reschedule viewing");
        }
        showToast("Viewing rescheduled.", "success");
      } catch (err) {
        // Revert optimistic update
        setSlots(prevSlots);
        setSelectedDay(draggedDate.getDate());
        showToast(
          err instanceof Error ? err.message : "Failed to reschedule viewing",
          "error",
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, year, month],
  );

  // -------------------------------------------------------------------------
  // Form submit
  // -------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const startTime = `${formDate}T${formStartTime}:00`;
      const endTime = `${formDate}T${formEndTime}:00`;

      const res = await fetch("/api/agent/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: formPropertyId,
          start_time: startTime,
          end_time: endTime,
          notes: formNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create viewing slot");
      }

      const { slot } = (await res.json()) as { slot: AgentViewingSlot };
      setSlots((prev) =>
        [...prev, slot].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        ),
      );
      setShowForm(false);
      setFormDate("");
      setFormStartTime("");
      setFormEndTime("");
      setFormPropertyId("");
      setFormNotes("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Viewing Calendar</h1>
            <p className="text-muted-foreground">
              Schedule and manage property viewings. Drag available slots to reschedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "Add Viewing Slot"}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={[
              "rounded-md px-4 py-2 text-sm font-medium",
              toast.kind === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200",
            ].join(" ")}
          >
            {toast.message}
          </div>
        )}

        {/* Add Viewing Form */}
        {showForm && (
          <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold">New Viewing Slot</h3>
            {formError && (
              <p className="mb-3 text-sm text-red-600">{formError}</p>
            )}
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Date
                </span>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Start Time
                </span>
                <input
                  type="time"
                  required
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  End Time
                </span>
                <input
                  type="time"
                  required
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Property ID
                </span>
                <input
                  type="text"
                  required
                  placeholder="UUID of the property"
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Notes (optional)
                </span>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Slot"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="rounded-lg border bg-white dark:bg-gray-900">
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              &larr; Previous
            </button>
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Next &rarr;
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b bg-gray-50 dark:bg-gray-800">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells — droppable */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const viewingsCount = day ? getViewingsForDay(day).length : 0;
              const isSelected = day === selectedDay;
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();

              return (
                <DroppableDay
                  key={idx}
                  day={day}
                  isSelected={isSelected}
                  isToday={isToday}
                  viewingsCount={viewingsCount}
                  onClick={() => day && setSelectedDay(day)}
                />
              );
            })}
          </div>
        </div>

        {/* Selected day viewings list — draggable cards */}
        {selectedDay !== null && (
          <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold">
              Viewings for {selectedDay} {monthName}
            </h3>
            {selectedViewings.length === 0 ? (
              <p className="text-sm text-gray-500">No viewings scheduled for this day.</p>
            ) : (
              <ul className="space-y-2">
                {selectedViewings.map((slot) => (
                  <DraggableViewingCard key={slot.id} slot={slot} />
                ))}
              </ul>
            )}
            {activeSlot && (
              <p className="mt-2 text-xs text-gray-400">
                Drag to a calendar day to reschedule. Booked viewings cannot be moved.
              </p>
            )}
          </div>
        )}
      </div>

      {/* DragOverlay — ghost card while dragging */}
      <DragOverlay>
        {activeSlot ? <DraggableViewingCard slot={activeSlot} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
