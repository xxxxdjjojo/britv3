"use client";

import { useState, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { AgentViewingSlot } from "@/types/agent";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from "lucide-react";

type ViewMode = "day" | "week" | "month";

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getWeekDates(referenceDate: Date): Date[] {
  const start = new Date(referenceDate);
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDotMap(slots: AgentViewingSlot[]): Map<string, { booked: boolean; available: boolean }> {
  const map = new Map<string, { booked: boolean; available: boolean }>();
  for (const slot of slots) {
    const dateKey = slot.start_time.slice(0, 10);
    const existing = map.get(dateKey) ?? { booked: false, available: false };
    if (slot.is_booked) {
      existing.booked = true;
    } else {
      existing.available = true;
    }
    map.set(dateKey, existing);
  }
  return map;
}

type PublishSlotFormData = {
  property_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string;
};

type EditSlotDialogProps = Readonly<{
  slot: AgentViewingSlot;
  onClose: () => void;
  onSaved: () => void;
  agentId: string;
}>;

function EditSlotDialog({ slot, onClose, onSaved, agentId }: EditSlotDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startDate = new Date(slot.start_time);
  const endDate = new Date(slot.end_time);

  const [form, setForm] = useState({
    date: startDate.toISOString().slice(0, 10),
    start_time: formatTime(slot.start_time),
    end_time: formatTime(slot.end_time),
    notes: slot.notes ?? "",
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const startIso = `${form.date}T${form.start_time}:00`;
      const endIso = `${form.date}T${form.end_time}:00`;
      const res = await fetch(`/api/agent/viewings?slot_id=${encodeURIComponent(slot.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to update slot");
      }
      const createRes = await fetch("/api/agent/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: slot.property_id,
          start_time: startIso,
          end_time: endIso,
          notes: form.notes || null,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json() as { error?: string };
        throw new Error(data.error ?? "Failed to create updated slot");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Suppress unused variable warning — agentId available for future use
  void agentId;
  void startDate;
  void endDate;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Viewing Slot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              disabled={slot.is_booked}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start time</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                disabled={slot.is_booked}
              />
            </div>
            <div className="space-y-1">
              <Label>End time</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                disabled={slot.is_booked}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes..."
            />
          </div>
          {slot.is_booked && (
            <p className="text-sm text-amber-600">This slot is already booked and cannot be edited.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || slot.is_booked}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ViewingCalendarProps = Readonly<{
  initialSlots: AgentViewingSlot[];
  agentId: string;
}>;

export function ViewingCalendar({ initialSlots, agentId }: ViewingCalendarProps) {
  const [mode, setMode] = useState<ViewMode>("month");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [slots, setSlots] = useState<AgentViewingSlot[]>(initialSlots);
  const [publishOpen, setPublishOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<AgentViewingSlot | null>(null);
  const [publishForm, setPublishForm] = useState<PublishSlotFormData>({
    property_id: "",
    date: new Date().toISOString().slice(0, 10),
    start_time: "09:00",
    end_time: "09:30",
    notes: "",
  });
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Supabase Realtime subscription
  const refreshSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/viewings");
      const data = await res.json() as { slots?: AgentViewingSlot[] };
      if (data.slots) {
        setSlots(data.slots);
      }
    } catch {
      // Silently ignore refresh errors
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("viewing-slots-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_viewing_slots", filter: `agent_id=eq.${agentId}` },
        () => { void refreshSlots(); },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agentId, refreshSlots]);

  const dotMap = getMonthDotMap(slots);

  // Navigation
  function navigate(direction: 1 | -1) {
    const d = new Date(referenceDate);
    if (mode === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (mode === "week") {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setDate(d.getDate() + direction);
    }
    setReferenceDate(d);
  }

  function navLabel(): string {
    if (mode === "month") {
      return referenceDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    if (mode === "week") {
      const days = getWeekDates(referenceDate);
      const first = days[0];
      const last = days[6];
      return `${first.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${last.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return referenceDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const startIso = `${publishForm.date}T${publishForm.start_time}:00`;
      const endIso = `${publishForm.date}T${publishForm.end_time}:00`;
      const res = await fetch("/api/agent/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: publishForm.property_id,
          start_time: startIso,
          end_time: endIso,
          notes: publishForm.notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to create slot");
      }
      setPublishOpen(false);
      setPublishForm({
        property_id: "",
        date: new Date().toISOString().slice(0, 10),
        start_time: "09:00",
        end_time: "09:30",
        notes: "",
      });
      await refreshSlots();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPublishing(false);
    }
  }

  // Slots for a given date
  function slotsForDate(date: Date): AgentViewingSlot[] {
    return slots.filter((s) => isSameDay(new Date(s.start_time), date));
  }

  function renderSlotCard(slot: AgentViewingSlot) {
    return (
      <button
        key={slot.id}
        type="button"
        onClick={() => setEditSlot(slot)}
        className="w-full text-left rounded-md border p-2 hover:bg-muted transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Clock className="size-3 text-muted-foreground" />
            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </div>
          <Badge
            variant={slot.is_booked ? "default" : "secondary"}
            className={slot.is_booked ? "bg-blue-600" : "bg-green-600 text-white"}
          >
            {slot.is_booked ? "Booked" : "Available"}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          Property: {slot.property_id.slice(0, 8)}…
        </div>
        {slot.booked_by && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3" />
            Booked by: {slot.booked_by.slice(0, 8)}…
          </div>
        )}
      </button>
    );
  }

  function renderDayView() {
    const daySlots = slotsForDate(referenceDate);
    return (
      <div className="space-y-2">
        {daySlots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No viewing slots on this day.</p>
        ) : (
          daySlots.map(renderSlotCard)
        )}
      </div>
    );
  }

  function renderWeekView() {
    const weekDates = getWeekDates(referenceDate);
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((day) => {
          const daySlots = slotsForDate(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="min-h-24 border rounded-md p-1">
              <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
              </div>
              <div className="space-y-1">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setEditSlot(slot)}
                    className={`w-full text-left rounded px-1 py-0.5 text-xs truncate transition-colors hover:opacity-80 ${
                      slot.is_booked ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {formatTime(slot.start_time)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMonthView() {
    return (
      <DayPicker
        mode="single"
        month={new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)}
        onMonthChange={setReferenceDate}
        onDayClick={(day) => {
          setReferenceDate(day);
          setMode("day");
        }}
        components={{
          Day: ({ day }) => {
            const dateKey = day.date.toISOString().slice(0, 10);
            const dots = dotMap.get(dateKey);
            const isToday = isSameDay(day.date, new Date());
            return (
              <button
                type="button"
                onClick={() => {
                  setReferenceDate(day.date);
                  setMode("day");
                }}
                className={`relative flex flex-col items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-sm ${
                  isToday ? "font-bold text-primary ring-1 ring-primary" : ""
                }`}
              >
                {day.date.getDate()}
                {dots && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dots.booked && <span className="size-1 rounded-full bg-blue-500" />}
                    {dots.available && <span className="size-1 rounded-full bg-green-500" />}
                  </div>
                )}
              </button>
            );
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-48 text-center">{navLabel()}</span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {(["day", "week", "month"] as ViewMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m)}
              className="capitalize"
            >
              {m}
            </Button>
          ))}
          <Button onClick={() => setPublishOpen(true)}>
            <Plus className="mr-2 size-4" />
            Publish Availability
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-green-500 inline-block" />
          Available
        </div>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-blue-500 inline-block" />
          Booked
        </div>
      </div>

      {/* Calendar view */}
      <div>
        {mode === "month" && renderMonthView()}
        {mode === "week" && renderWeekView()}
        {mode === "day" && renderDayView()}
      </div>

      {/* Publish Availability Dialog */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Availability Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Property ID</Label>
              <Input
                placeholder="Enter property UUID"
                value={publishForm.property_id}
                onChange={(e) => setPublishForm((f) => ({ ...f, property_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={publishForm.date}
                onChange={(e) => setPublishForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={publishForm.start_time}
                  onChange={(e) => setPublishForm((f) => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={publishForm.end_time}
                  onChange={(e) => setPublishForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any notes for this slot..."
                value={publishForm.notes}
                onChange={(e) => setPublishForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {publishError && <p className="text-sm text-destructive">{publishError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button onClick={() => void handlePublish()} disabled={publishing}>
              {publishing ? "Publishing..." : "Publish slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      {editSlot && (
        <EditSlotDialog
          slot={editSlot}
          onClose={() => setEditSlot(null)}
          onSaved={() => { setEditSlot(null); void refreshSlots(); }}
          agentId={agentId}
        />
      )}
    </div>
  );
}
