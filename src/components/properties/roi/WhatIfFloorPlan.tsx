"use client";

import Image from "next/image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  floorPlanUrl: string | null;
  selectedRenovationType: string | null;
}>;

// ---------------------------------------------------------------------------
// Overlay config by renovation type
// ---------------------------------------------------------------------------

type OverlayConfig = {
  label: string;
  style: React.CSSProperties;
};

function getOverlayConfig(renovationType: string): OverlayConfig {
  switch (renovationType) {
    case "loft_conversion":
      return {
        label: "Loft Conversion Zone",
        style: {
          top: 0,
          left: 0,
          right: 0,
          height: "25%",
          backgroundColor: "rgba(212, 168, 83, 0.4)", // --brand-secondary
        },
      };
    case "extension":
      return {
        label: "Extension Zone",
        style: {
          top: 0,
          right: 0,
          bottom: 0,
          width: "20%",
          backgroundColor: "rgba(37, 99, 235, 0.4)", // --brand-accent
        },
      };
    case "kitchen":
      return {
        label: "Kitchen Renovation Zone",
        style: {
          top: "35%",
          left: "35%",
          width: "30%",
          height: "30%",
          backgroundColor: "rgba(212, 168, 83, 0.4)", // --brand-secondary
        },
      };
    case "bathroom":
      return {
        label: "Bathroom Renovation Zone",
        style: {
          top: 0,
          right: 0,
          width: "15%",
          height: "15%",
          backgroundColor: "rgba(37, 99, 235, 0.4)", // --brand-accent
        },
      };
    case "full_refurb":
      return {
        label: "Full Refurbishment",
        style: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(27, 77, 62, 0.2)", // --brand-primary
        },
      };
    default:
      return {
        label: "Renovation Zone",
        style: {
          top: "37.5%",
          left: "37.5%",
          width: "25%",
          height: "25%",
          backgroundColor: "rgba(212, 168, 83, 0.3)", // --brand-secondary
        },
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WhatIfFloorPlan({ floorPlanUrl, selectedRenovationType }: Props) {
  if (floorPlanUrl === null) {
    return null;
  }

  const overlay =
    selectedRenovationType !== null
      ? getOverlayConfig(selectedRenovationType)
      : null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Image + overlay wrapper */}
      <div className="relative w-full aspect-[4/3] bg-neutral-50">
        <Image
          src={floorPlanUrl}
          alt="Floor plan with renovation overlay"
          fill
          unoptimized
          loading="lazy"
          className="object-contain"
          sizes="(min-width: 1024px) 60vw, 100vw"
        />

        {overlay !== null && (
          <div
            className="absolute transition-all duration-300"
            style={overlay.style}
          >
            {/* Label badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
              <span className="rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-neutral-800 shadow-sm text-center leading-snug">
                {overlay.label}
              </span>
              <span className="text-[10px] italic text-white drop-shadow text-center leading-tight">
                Approximate area for illustration only
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer note when no type is selected */}
      {selectedRenovationType === null && (
        <p className="px-4 py-2 text-xs text-muted-foreground border-t">
          Select a renovation type above to see the approximate affected area.
        </p>
      )}
    </div>
  );
}
