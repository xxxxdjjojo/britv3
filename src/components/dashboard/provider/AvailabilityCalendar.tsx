"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type BlockedRange = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
};

type BookingSlim = {
  id: string;
  booking_reference: string;
  scheduled_start_date: string;
  scheduled_end_date: string;
};

type Props = Readonly<{
  initialBlockedRanges: BlockedRange[];
  initialBookings: BookingSlim[];
}>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  // month is 1-based
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  // ISO week: Mon=0 … Sun=6
  const startDow = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month - 1, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function inRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

function buildBlockedSet(ranges: BlockedRange[]): Set<string> {
  const s = new Set<string>();
  for (const r of ranges) {
    const cur = new Date(r.start_date);
    const end = new Date(r.end_date);
    while (cur <= end) {
      s.add(toDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return s;
}

function buildBookingMap(bookings: BookingSlim[]): Map<string, BookingSlim[]> {
  const m = new Map<string, BookingSlim[]>();
  for (const b of bookings) {
    const cur = new Date(b.scheduled_start_date);
    const end = new Date(b.scheduled_end_date);
    while (cur <= end) {
      const key = toDateStr(cur);
      const arr = m.get(key) ?? [];
      arr.push(b);
      m.set(key, arr);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return m;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Component ────────────────────────────────────────────────────────────────

export function AvailabilityCalendar({
  initialBlockedRanges,
  initialBookings,
}: Props) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-based

  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>(initialBlockedRanges);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blockedSet = buildBlockedSet(blockedRanges);
  const bookingMap = buildBookingMap(initialBookings);
  const cells = buildCalendarGrid(viewYear, viewMonth);

  // Derived stats
  const bookedCount = Array.from(bookingMap.keys()).length;
  const blockedCount = blockedRanges.length;

  // ── Navigation ─────────────────────────────────────────────────────────────

  function goToPrev() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNext() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────

  const handleToggle = useCallback(
    (dateStr: string) => {
      if (bookingMap.has(dateStr)) return;
      const willBlock = !blockedSet.has(dateStr);

      setError(null);

      if (willBlock) {
        setBlockedRanges((prev) => [
          ...prev,
          {
            id: `optimistic-${dateStr}`,
            start_date: dateStr,
            end_date: dateStr,
            reason: null,
          },
        ]);
      } else {
        setBlockedRanges((prev) =>
          prev.filter(
            (r) => !(r.start_date === dateStr && r.end_date === dateStr),
          ),
        );
      }

      startTransition(async () => {
        try {
          const res = await fetch("/api/provider/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateStr, is_available: !willBlock }),
          });

          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(body?.error ?? "Failed to update availability");
          }

          if (willBlock) {
            const json = (await res.json()) as {
              data?: { id?: string; date?: string };
            };
            const serverId = json?.data?.id;
            if (serverId) {
              setBlockedRanges((prev) =>
                prev.map((r) =>
                  r.id === `optimistic-${dateStr}`
                    ? { ...r, id: serverId }
                    : r,
                ),
              );
            }
          }
        } catch (err) {
          if (willBlock) {
            setBlockedRanges((prev) =>
              prev.filter((r) => r.id !== `optimistic-${dateStr}`),
            );
          } else {
            setBlockedRanges((prev) => [
              ...prev,
              {
                id: `rollback-${dateStr}`,
                start_date: dateStr,
                end_date: dateStr,
                reason: null,
              },
            ]);
          }
          setError(
            err instanceof Error ? err.message : "Failed to update availability",
          );
        }
      });
    },
    [blockedSet, bookingMap, startTransition],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* ── Calendar Header ── */}
      <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold text-neutral-900 font-heading">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              aria-label="Previous month"
              className="p-2 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={goToNext}
              aria-label="Next month"
              className="p-2 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-error-light px-4 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {/* ── Day of Week Headers ── */}
      <div className="grid grid-cols-7 border-b border-neutral-100">
        {DAY_NAMES.map((d, i) => (
          <div
            key={d}
            className={[
              "py-4 text-center text-xs font-bold uppercase tracking-widest",
              i >= 5 ? "text-emerald-600" : "text-neutral-400",
            ].join(" ")}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar Body ── */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-[400px]">
        {cells.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={`blank-${idx}`}
                className="border-r border-b border-neutral-100 bg-neutral-50/30"
              />
            );
          }

          const ds = toDateStr(date);
          const isToday = ds === todayStr;
          const isBlocked = blockedSet.has(ds);
          const dayBookings = bookingMap.get(ds) ?? [];
          const isBooked = dayBookings.length > 0;
          const isPast = ds < todayStr;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          let cellClass =
            "p-3 border-r border-b border-neutral-100 relative group transition-colors cursor-pointer hover:bg-emerald-50/20";

          if (isBooked) {
            cellClass = "p-3 border-r border-b border-neutral-100 relative";
          } else if (isBlocked) {
            cellClass =
              "p-3 border-r border-b border-neutral-100 relative cursor-pointer bg-neutral-200/40 hover:bg-neutral-200/60 transition-colors";
          } else if (isPast) {
            cellClass =
              "p-3 border-r border-b border-neutral-100 relative opacity-40 cursor-default";
          } else if (isWeekend) {
            cellClass =
              "p-3 border-r border-b border-neutral-100 relative bg-emerald-50/30 cursor-pointer hover:bg-emerald-50/50 transition-colors";
          }

          if (isToday && !isBooked) {
            cellClass += " bg-emerald-50/40";
          }

          return (
            <div
              key={ds}
              className={cellClass}
              onClick={() => {
                if (!isBooked && !isPast) handleToggle(ds);
              }}
              title={
                isBooked
                  ? "Booked — cannot toggle"
                  : isBlocked
                    ? "Click to unblock"
                    : isPast
                      ? undefined
                      : "Click to mark unavailable"
              }
            >
              {/* Date number */}
              {isToday ? (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-900 text-white rounded-full text-xs font-bold">
                  {date.getDate()}
                </span>
              ) : (
                <span
                  className={[
                    "text-sm font-semibold",
                    isWeekend ? "text-emerald-900" : "text-neutral-900",
                    isPast ? "text-neutral-400" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </span>
              )}

              {isToday && (
                <p className="mt-1 text-[10px] text-emerald-900 font-bold">Today</p>
              )}

              {/* Events */}
              <div className="mt-1 space-y-1">
                {isBlocked && !isBooked && (
                  <div className="px-2 py-0.5 bg-neutral-300 rounded text-[10px] text-neutral-700 font-bold truncate">
                    {blockedRanges.find((r) => inRange(ds, r.start_date, r.end_date))?.reason ?? "Unavailable"}
                  </div>
                )}

                {isBooked &&
                  dayBookings.slice(0, 2).map((b) => (
                    <Link
                      key={b.id}
                      href={`/dashboard/provider/jobs/${b.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate rounded px-2 py-0.5 bg-brand-primary text-[10px] text-white font-bold hover:opacity-90 transition-opacity"
                    >
                      {b.booking_reference}
                    </Link>
                  ))}

                {isBooked && dayBookings.length > 2 && (
                  <span className="block text-[10px] text-brand-primary font-bold">
                    +{dayBookings.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Calendar Footer ── */}
      <div className="bg-neutral-50 px-6 py-4 flex items-center justify-between border-t border-neutral-100">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            {bookedCount} Job{bookedCount !== 1 ? "s" : ""} Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            {blockedCount} Personal Block{blockedCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">All times in GMT+0 (London)</span>
        </div>
      </div>

      {isPending && (
        <div className="px-6 pb-2">
          <p className="text-xs text-neutral-400">Saving…</p>
        </div>
      )}
    </div>
  );
}
