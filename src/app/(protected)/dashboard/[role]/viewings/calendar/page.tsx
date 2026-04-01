"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useViewings } from "@/hooks/useViewings";
import type { Viewing } from "@/services/viewings/viewings-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function formatDateFull(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoString));
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert from Sunday=0 to Monday=0
  return day === 0 ? 6 : day - 1;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ViewingsCalendarPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = use(params);
  const { data: viewings, isLoading } = useViewings();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Group viewings by date key "YYYY-MM-DD"
  const viewingsByDate = useMemo(() => {
    const map = new Map<string, Viewing[]>();
    for (const v of viewings ?? []) {
      const d = new Date(v.scheduled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }, [viewings]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfWeek(currentYear, currentMonth);

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1,
  );

  const navigateMonth = (delta: number) => {
    setSelectedDay(null);
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  function dateKey(day: number): string {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const selectedViewings =
    selectedDay != null
      ? viewingsByDate.get(dateKey(selectedDay)) ?? []
      : [];

  const isToday = (day: number) =>
    day === now.getDate() &&
    currentMonth === now.getMonth() &&
    currentYear === now.getFullYear();

  // Build grid cells
  const cells: Array<{
    day: number;
    isCurrentMonth: boolean;
    viewingCount: number;
  }> = [];

  // Trailing days from previous month
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false, viewingCount: 0 });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const count = viewingsByDate.get(dateKey(d))?.length ?? 0;
    cells.push({ day: d, isCurrentMonth: true, viewingCount: count });
  }

  // Fill remaining to complete grid (6 rows)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isCurrentMonth: false, viewingCount: 0 });
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-on-surface mb-2">
              Viewings Calendar
            </h1>
            <p className="text-on-surface-variant font-sans max-w-2xl">
              View all your property viewings in a monthly calendar layout.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/${role}/viewings`}>
              <button
                className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                aria-label="List view"
              >
                <Calendar className="w-4 h-4" />
                List View
              </button>
            </Link>
            <Link href={`/dashboard/${role}/viewings/book`}>
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-lg font-heading text-sm font-semibold hover:bg-brand-primary/90 transition-colors shadow-sm"
                aria-label="Book a viewing"
              >
                <Plus className="w-4 h-4" />
                Book Viewing
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar grid */}
        <section className="xl:col-span-8 bg-surface-container-low rounded-xl p-8">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-on-surface">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container-lowest shadow-sm text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Go to today"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 text-center mb-3">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-[0.6875rem] font-bold tracking-widest text-outline uppercase pb-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-px bg-surface-container rounded-lg overflow-hidden border border-outline-variant">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-surface-container-lowest p-2 animate-pulse"
                >
                  <div className="h-3 w-4 bg-surface-container-low rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-surface-container rounded-lg overflow-hidden border border-outline-variant">
              {cells.map((cell, idx) => {
                const isSelected =
                  cell.isCurrentMonth && cell.day === selectedDay;
                const isTodayCell = cell.isCurrentMonth && isToday(cell.day);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!cell.isCurrentMonth}
                    onClick={() =>
                      cell.isCurrentMonth && setSelectedDay(cell.day)
                    }
                    className={`aspect-square bg-surface-container-lowest p-1.5 text-xs font-semibold relative transition-colors ${
                      !cell.isCurrentMonth
                        ? "text-outline cursor-default"
                        : isSelected
                          ? "bg-primary-container/30 ring-2 ring-inset ring-brand-primary"
                          : cell.viewingCount > 0
                            ? "bg-primary-container/20 hover:bg-primary-container/30 cursor-pointer"
                            : "text-on-surface hover:bg-surface-container-low cursor-pointer"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isTodayCell
                          ? "bg-brand-primary text-white"
                          : ""
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.viewingCount > 0 && (
                      <div className="absolute inset-x-1 bottom-1 bg-primary-container/30 text-[9px] p-0.5 rounded border-l-2 border-brand-primary text-brand-primary truncate leading-tight text-left">
                        {cell.viewingCount} viewing
                        {cell.viewingCount > 1 ? "s" : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Day detail sidebar */}
        <aside className="xl:col-span-4 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="font-heading text-lg font-bold text-on-surface mb-4">
              {selectedDay != null
                ? formatDateFull(
                    new Date(
                      currentYear,
                      currentMonth,
                      selectedDay,
                    ).toISOString(),
                  )
                : "Select a day"}
            </h3>

            {selectedDay == null ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-container">
                  <Calendar className="w-7 h-7 text-outline" />
                </div>
                <p className="text-sm text-on-surface-variant">
                  Click a day on the calendar to see viewing details
                </p>
              </div>
            ) : selectedViewings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-container">
                  <Calendar className="w-7 h-7 text-outline" />
                </div>
                <p className="text-sm text-on-surface-variant">
                  No viewings scheduled for this day
                </p>
                <Link href={`/dashboard/${role}/viewings/book`}>
                  <button
                    className="mt-2 flex items-center gap-2 px-4 py-2 border border-brand-primary/20 rounded-lg text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 transition-colors"
                    aria-label="Book a viewing"
                  >
                    <Plus className="w-4 h-4" />
                    Book a viewing
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedViewings.map((v) => (
                  <div
                    key={v.id}
                    className="bg-surface-container-lowest rounded-lg p-4 border-l-4 border-brand-primary"
                  >
                    <h4 className="font-heading text-sm font-bold text-on-surface mb-2 line-clamp-2">
                      {v.property_address}
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Clock className="w-3.5 h-3.5 text-outline" />
                        {formatTime(v.scheduled_at)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        {v.type === "virtual" ? (
                          <Video className="w-3.5 h-3.5 text-outline" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-outline" />
                        )}
                        {v.type === "virtual" ? "Virtual Tour" : "In-person"}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/${role}/viewings`}
                      className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
                    >
                      View details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status legend */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="font-heading text-xs font-bold tracking-widest uppercase text-outline mb-5">
              Calendar Key
            </h3>
            <div className="space-y-3">
              {[
                { dot: "bg-brand-primary", label: "Today" },
                {
                  dot: "bg-primary-container/40 border border-brand-primary/30",
                  label: "Has viewings",
                },
                { dot: "bg-surface-container-low", label: "No viewings" },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${dot}`} />
                  <span className="text-sm font-medium text-on-surface">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
