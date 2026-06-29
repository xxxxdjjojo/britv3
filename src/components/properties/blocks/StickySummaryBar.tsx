"use client";

import { useEffect, useState } from "react";
import { Bed, Bath, Square, Zap, Calendar as CalendarIcon } from "lucide-react";

type StickySummaryBarProps = {
  priceFormatted: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  epc: string;
  canBookViewing: boolean;
  /** Element id observed to decide when to reveal the bar (the resting header). */
  sentinelId?: string;
};

/**
 * Block 02 (scrolled state) — a condensed price + key-facts bar that slides in
 * once the resting SummaryHeader scrolls out of view, on desktop *and* mobile.
 * Reveal is driven by IntersectionObserver (no scroll handler churn); the bar
 * animates with `transform`/`opacity` only, and the transition is dropped under
 * `prefers-reduced-motion` via the `motion-reduce:` utilities.
 */
export function StickySummaryBar({
  priceFormatted,
  bedrooms,
  bathrooms,
  sqft,
  epc,
  canBookViewing,
  sentinelId = "property-summary-header",
}: StickySummaryBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Reveal only when the header has scrolled ABOVE the viewport, not when
        // it is still below the fold on first paint.
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-0 z-40 border-b bg-background/95 backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-4">
          <p className="shrink-0 text-lg font-bold text-primary">
            {priceFormatted}
          </p>
          <div className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <Bed className="size-4" />
              {bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-4" />
              {bathrooms}
            </span>
            {sqft > 0 && (
              <span className="flex items-center gap-1">
                <Square className="size-4" />
                {sqft.toLocaleString("en-GB")} sq ft
              </span>
            )}
            {epc !== "N/A" && (
              <span className="flex items-center gap-1">
                <Zap className="size-4" />
                EPC {epc}
              </span>
            )}
          </div>
        </div>

        {canBookViewing && (
          <a
            href="#book-viewing"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CalendarIcon className="size-4" />
            Book Viewing
          </a>
        )}
      </div>
    </div>
  );
}
