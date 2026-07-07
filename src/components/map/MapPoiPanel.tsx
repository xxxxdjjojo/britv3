"use client";

/**
 * MapPoiPanel — bien'ici-style "Points of interest" filter card overlay.
 *
 * Controlled + presentational: the parent owns `enabled` (a Set of
 * PoiCategoryKey) and calls `onToggle` on user interaction. This component
 * owns only the open/collapsed UI state via useState.
 *
 * Used by both the listing map and the search map — no map logic here.
 */

import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POI_CATEGORIES,
  type PoiCategoryKey,
} from "@/lib/map/poi-categories";

// ── Types ─────────────────────────────────────────────────────────────────────

type MapPoiPanelProps = Readonly<{
  /** Which categories are currently toggled on. */
  enabled: ReadonlySet<PoiCategoryKey>;
  /** Called with the key of the category the user toggled. */
  onToggle: (key: PoiCategoryKey) => void;
  /** Positioning class(es) supplied by the parent (e.g. "absolute top-4 right-4"). */
  className?: string;
}>;

// ── Component ─────────────────────────────────────────────────────────────────

export function MapPoiPanel({ enabled, onToggle, className }: MapPoiPanelProps) {
  const [open, setOpen] = useState(true);

  // ── Collapsed pill ─────────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Show points of interest"
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className={cn(
          // Glass-card pill — mirrors MarketMapLegend's backdrop idiom
          "flex min-h-[36px] items-center gap-2 rounded-[9999px]",
          "border border-white/20 bg-white/90 px-4 py-2",
          "shadow-[var(--shadow-xl)] backdrop-blur-sm",
          "font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#46464F]",
          "cursor-pointer transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-1",
          className,
        )}
      >
        <MapPin size={14} aria-hidden="true" className="shrink-0 text-[#1B4D3E]" />
        Points of interest
      </button>
    );
  }

  // ── Expanded card ──────────────────────────────────────────────────────────

  return (
    <div
      role="group"
      aria-label="Points of interest filters"
      className={cn(
        // Glass card — same idiom as MarketMapLegend
        "rounded-[var(--radius-md)] border border-white/20 bg-white/90",
        "shadow-[var(--shadow-xl)] backdrop-blur-sm",
        "w-52",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#46464F]">
          Points of interest
        </span>
        <button
          type="button"
          aria-label="Collapse points of interest"
          aria-expanded={true}
          onClick={() => setOpen(false)}
          className={cn(
            "flex min-h-[36px] min-w-[36px] items-center justify-center",
            "rounded-full text-[#7A7A88] transition-colors hover:bg-[#E8F5EE] hover:text-[#1B4D3E]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-1",
          )}
        >
          <span aria-hidden="true" className="text-base leading-none">×</span>
        </button>
      </div>

      {/* Category rows */}
      <ul className="flex flex-col px-1 pb-2" role="list">
        {POI_CATEGORIES.map((cat) => (
          <li key={cat.key}>
            <label
              className={cn(
                "flex min-h-[36px] cursor-pointer items-center gap-2.5 rounded px-2 py-1",
                "transition-colors hover:bg-[#F0F7F4]",
                "font-sans text-sm text-[#0A0A0B]",
              )}
            >
              <input
                type="checkbox"
                checked={enabled.has(cat.key)}
                onChange={() => onToggle(cat.key)}
                className="accent-[#1B4D3E] cursor-pointer"
              />
              <span className="flex-1 leading-tight">{cat.label}</span>
              {/* Colour dot — data-poi-dot for test queries */}
              <span
                data-poi-dot={cat.key}
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
