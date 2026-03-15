"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Expand, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FloorPlanAnnotation = {
  room: string;
  area_sqm: number;
  vs_average: "above" | "below" | "average";
};

type Floor = { label: string; imageUrl: string };

type FloorPlanViewerProps = Readonly<{
  floors: Array<Floor>;
  annotations?: FloorPlanAnnotation[] | null;
}>;

// ---------------------------------------------------------------------------
// Annotation badge helpers
// ---------------------------------------------------------------------------

type AnnotationBadgeProps = {
  annotation: FloorPlanAnnotation;
};

function AnnotationBadge({ annotation }: AnnotationBadgeProps) {
  const { room, area_sqm, vs_average } = annotation;

  const badge = {
    above: {
      label: "↑ Above avg",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    below: {
      label: "↓ Below avg",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    average: {
      label: "~ Avg",
      className: "bg-neutral-100 text-neutral-600 border-neutral-200",
    },
  }[vs_average];

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-foreground">{room}</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">{area_sqm} m²</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloorPlanViewer({
  floors,
  annotations,
}: FloorPlanViewerProps) {
  const [activeFloor, setActiveFloor] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Empty state
  if (floors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-neutral-50 p-10 text-center">
        <LayoutTemplate className="size-10 text-neutral-300" />
        <p className="text-sm text-muted-foreground">
          Floor plan not available for this property.
        </p>
      </div>
    );
  }

  const current = floors[activeFloor];

  return (
    <>
      <div className="rounded-xl border bg-card p-4 space-y-4">
        {/* Floor switcher tabs */}
        {floors.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {floors.map((floor, i) => (
              <button
                key={i}
                onClick={() => setActiveFloor(i)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
                  i === activeFloor
                    ? "bg-[#1B4D3E] text-white border-[#1B4D3E]"
                    : "bg-background text-foreground border-border hover:bg-muted",
                )}
              >
                {floor.label}
              </button>
            ))}
          </div>
        )}

        {/* Floor plan image */}
        <div className="relative rounded-lg overflow-hidden bg-neutral-50 border">
          {current.imageUrl ? (
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={current.imageUrl}
                alt={`${current.label} floor plan`}
                fill
                loading="lazy"
                className="object-contain"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Floor plan image not available
              </p>
            </div>
          )}

          {/* Expand button */}
          {current.imageUrl && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 right-3 gap-1.5 shadow-sm"
              onClick={() => setLightboxOpen(true)}
            >
              <Expand className="size-4" />
              Expand
            </Button>
          )}
        </div>

        {/* AI Annotations */}
        {annotations && annotations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              AI Room Analysis
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {annotations.map((annotation, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-muted/30 p-2.5"
                >
                  <AnnotationBadge annotation={annotation} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close floor plan"
          >
            <X className="size-5" />
          </button>

          {/* Floor tabs in lightbox */}
          {floors.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {floors.map((floor, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFloor(i)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    i === activeFloor
                      ? "bg-white text-black"
                      : "bg-white/20 text-white hover:bg-white/30",
                  )}
                >
                  {floor.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative w-full max-w-4xl aspect-[4/3]">
            {current.imageUrl ? (
              <Image
                src={current.imageUrl}
                alt={`${current.label} floor plan`}
                fill
                loading="lazy"
                className="object-contain"
                sizes="90vw"
              />
            ) : (
              <div className="w-full h-full bg-neutral-200 flex items-center justify-center rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Floor plan not available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
