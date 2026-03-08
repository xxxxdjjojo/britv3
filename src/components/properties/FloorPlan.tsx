"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Floor = { label: string; imageUrl: string };

type FloorPlanProps = Readonly<{
  floors: Floor[];
  className?: string;
}>;

export function FloorPlan({ floors, className }: FloorPlanProps) {
  const [activeFloor, setActiveFloor] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (floors.length === 0) {
    return null;
  }

  const current = floors[activeFloor];

  return (
    <>
      <div className={cn("rounded-xl border bg-card p-4", className)}>
        {/* Floor tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {floors.map((floor, i) => (
            <button
              key={i}
              onClick={() => setActiveFloor(i)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
                i === activeFloor
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted",
              )}
            >
              {floor.label}
            </button>
          ))}
        </div>

        {/* Floor plan image */}
        <div className="relative rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center">
          {current.imageUrl ? (
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={current.imageUrl}
                alt={`${current.label} floor plan`}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Floor plan not available
              </span>
            </div>
          )}

          {/* Expand button */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 gap-1.5 shadow"
            onClick={() => setLightboxOpen(true)}
          >
            <Expand className="size-4" />
            Expand
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          {/* Floor tabs in lightbox */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
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

          <div className="relative w-full max-w-4xl aspect-[4/3]">
            {current.imageUrl ? (
              <Image
                src={current.imageUrl}
                alt={`${current.label} floor plan`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            ) : (
              <div className="w-full h-full bg-neutral-200 flex items-center justify-center rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Floor plan not available
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
