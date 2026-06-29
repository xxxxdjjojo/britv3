"use client";

import { useMemo, useState } from "react";
import { DevelopmentCard } from "./DevelopmentCard";
import {
  filterDevelopments,
  type NewHomesFilters,
} from "@/lib/new-homes/filters";
import type {
  DevelopmentCard as DevelopmentCardModel,
  DevelopmentSchemeType,
  DevelopmentStatus,
} from "@/lib/new-homes/types";
import { cn } from "@/lib/utils";

const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "Up to £250k", value: "250000" },
  { label: "Up to £400k", value: "400000" },
  { label: "Up to £600k", value: "600000" },
  { label: "Up to £1m", value: "1000000" },
];

const BEDS_OPTIONS = [
  { label: "Any beds", value: "" },
  { label: "1+ bed", value: "1" },
  { label: "2+ beds", value: "2" },
  { label: "3+ beds", value: "3" },
  { label: "4+ beds", value: "4" },
];

const SCHEME_OPTIONS: { label: string; value: "" | DevelopmentSchemeType }[] = [
  { label: "All types", value: "" },
  { label: "Houses", value: "houses" },
  { label: "Apartments", value: "apartments" },
  { label: "Houses & apartments", value: "mixed" },
  { label: "Retirement", value: "retirement" },
  { label: "Shared ownership", value: "shared_ownership" },
];

const STATUS_OPTIONS: { label: string; value: "" | DevelopmentStatus }[] = [
  { label: "Any status", value: "" },
  { label: "Available", value: "available" },
  { label: "Coming soon", value: "coming_soon" },
  { label: "Selling fast", value: "reserved" },
];

const selectClass =
  "h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-700 shadow-sm focus:border-[#1B4D3E] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]";

function Toggle({
  active,
  onClick,
  children,
}: Readonly<{ active: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg border px-3 text-sm font-medium shadow-sm transition-colors",
        active
          ? "border-[#1B4D3E] bg-[#1B4D3E] text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400",
      )}
    >
      {children}
    </button>
  );
}

export function NewHomesBrowser({
  developments,
  initialFilters = {},
}: Readonly<{
  developments: DevelopmentCardModel[];
  initialFilters?: NewHomesFilters;
}>) {
  const [filters, setFilters] = useState<NewHomesFilters>(initialFilters);

  const filtered = useMemo(
    () => filterDevelopments(developments, filters),
    [developments, filters],
  );

  const update = (patch: Partial<NewHomesFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const hasActiveFilters =
    !!filters.q ||
    filters.maxPrice != null ||
    filters.bedsMin != null ||
    !!filters.schemeType ||
    !!filters.status ||
    !!filters.helpToBuy ||
    !!filters.firstHomes;

  return (
    <div>
      {/* Filter bar */}
      <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[200px]">
            <span className="sr-only">Search by location or development</span>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              inputMode="search"
              placeholder="Search town, postcode or development"
              value={filters.q ?? ""}
              onChange={(e) => update({ q: e.target.value })}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-800 shadow-sm focus:border-[#1B4D3E] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
            />
          </label>

          <select
            className={selectClass}
            value={filters.maxPrice?.toString() ?? ""}
            onChange={(e) =>
              update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={filters.bedsMin?.toString() ?? ""}
            onChange={(e) =>
              update({ bedsMin: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            {BEDS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={filters.schemeType ?? ""}
            onChange={(e) =>
              update({
                schemeType: (e.target.value || undefined) as
                  | DevelopmentSchemeType
                  | undefined,
              })
            }
          >
            {SCHEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={filters.status ?? ""}
            onChange={(e) =>
              update({
                status: (e.target.value || undefined) as DevelopmentStatus | undefined,
              })
            }
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <Toggle
            active={!!filters.helpToBuy}
            onClick={() => update({ helpToBuy: !filters.helpToBuy })}
          >
            Help to Buy
          </Toggle>
          <Toggle
            active={!!filters.firstHomes}
            onClick={() => update({ firstHomes: !filters.firstHomes })}
          >
            First Homes
          </Toggle>
        </div>
      </div>

      {/* Results header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "development" : "developments"}
          {hasActiveFilters ? " match your search" : " available now"}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="text-sm font-medium text-[#1B4D3E] hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
          <h3 className="font-heading text-lg font-semibold text-neutral-800">
            No developments match your search
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            Try widening your price range or clearing some filters. New schemes
            are added regularly.
          </p>
          <button
            type="button"
            onClick={() => setFilters({})}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1B4D3E] px-4 text-sm font-semibold text-white hover:bg-[#2D7A5F]"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dev) => (
            <DevelopmentCard key={dev.id} development={dev} />
          ))}
        </div>
      )}
    </div>
  );
}
