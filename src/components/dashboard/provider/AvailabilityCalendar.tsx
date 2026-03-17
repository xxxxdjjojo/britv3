"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const startDow = (firstDay.getDay() + 6) % 7; // offset for Mon-first grid
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month - 1, d));
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Returns true when dateStr falls within [start, end] inclusive. */
function inRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

/** Expand BlockedRange list into a Set of date strings. */
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

/** Expand bookings into a Map<dateStr, BookingSlim[]>. */
function buildBookingMap(
  bookings: BookingSlim[],
): Map<string, BookingSlim[]> {
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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

  // Local state for blocked ranges (optimistic updates)
  const [blockedRanges, setBlockedRanges] =
    useState<BlockedRange[]>(initialBlockedRanges);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blockedSet = buildBlockedSet(blockedRanges);
  const bookingMap = buildBookingMap(initialBookings);
  const cells = buildCalendarGrid(viewYear, viewMonth);

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
      if (bookingMap.has(dateStr)) return; // booked → not toggleable
      const willBlock = !blockedSet.has(dateStr);

      setError(null);

      // Optimistic update
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

          // If unblocking succeeded, the optimistic state is correct.
          // If blocking succeeded, replace the optimistic id with real server data.
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
          // Rollback optimistic update
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
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous month"
            onClick={goToPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next month"
            onClick={goToNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-neutral-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div
        className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-neutral-200 bg-neutral-200"
        style={
          {
            "--stripe": "rgba(0,0,0,0.04)",
          } as React.CSSProperties
        }
      >
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`blank-${idx}`} className="bg-white min-h-[72px]" />;
          }

          const ds = toDateStr(date);
          const isToday = ds === todayStr;
          const isBlocked = blockedSet.has(ds);
          const dayBookings = bookingMap.get(ds) ?? [];
          const isBooked = dayBookings.length > 0;
          const isPast = ds < todayStr;

          // Determine cell style
          let cellClass =
            "relative min-h-[72px] p-1.5 bg-white cursor-pointer transition-colors hover:bg-neutral-50";

          if (isBooked) {
            cellClass =
              "relative min-h-[72px] p-1.5 bg-[#E8F5EE] border border-[#1B4D3E] cursor-default";
          } else if (isBlocked) {
            cellClass =
              "relative min-h-[72px] p-1.5 bg-neutral-100 cursor-pointer transition-colors hover:bg-neutral-200";
          } else if (isPast) {
            cellClass =
              "relative min-h-[72px] p-1.5 bg-white opacity-40 cursor-default";
          }

          const dateNum = (
            <span
              className={[
                "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                isToday
                  ? "ring-2 ring-[#1B4D3E] ring-offset-1 text-[#1B4D3E] font-bold"
                  : "text-neutral-700",
              ].join(" ")}
            >
              {date.getDate()}
            </span>
          );

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
                    ? "Marked unavailable — click to unblock"
                    : isPast
                      ? undefined
                      : "Click to mark unavailable"
              }
            >
              {/* Diagonal stripe overlay for blocked */}
              {isBlocked && !isBooked && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
                    backgroundSize: "8px 8px",
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col gap-1">
                {dateNum}

                {isBlocked && !isBooked && (
                  <span className="block truncate text-[10px] text-neutral-500">
                    Unavailable
                  </span>
                )}

                {isBooked &&
                  dayBookings.slice(0, 2).map((b) => (
                    <Link
                      key={b.id}
                      href={`/dashboard/provider/jobs/${b.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate rounded bg-[#1B4D3E]/10 px-1 text-[10px] font-medium text-[#1B4D3E] hover:underline"
                    >
                      {b.booking_reference}
                    </Link>
                  ))}

                {isBooked && dayBookings.length > 2 && (
                  <span className="block text-[10px] text-[#1B4D3E]">
                    +{dayBookings.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 pt-1">
        <LegendItem
          color="bg-white border border-neutral-200"
          label="Available"
        />
        <LegendItem
          color="bg-neutral-100"
          label="Blocked"
          stripe
        />
        <LegendItem
          color="bg-[#E8F5EE] border border-[#1B4D3E]"
          label="Booked"
        />
        <div className="flex items-center gap-2">
          <span className="inline-flex size-4 items-center justify-center rounded-full ring-2 ring-[#1B4D3E]" />
          <span className="text-xs text-neutral-600">Today</span>
        </div>
      </div>

      {isPending && (
        <p className="text-xs text-neutral-400">Saving…</p>
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
  stripe,
}: Readonly<{ color: string; label: string; stripe?: boolean }>) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`relative inline-block size-4 rounded ${color} overflow-hidden`}
      >
        {stripe && (
          <span
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
              backgroundSize: "6px 6px",
            }}
          />
        )}
      </span>
      <span className="text-xs text-neutral-600">{label}</span>
    </div>
  );
}
