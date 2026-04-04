"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Expand, Download } from "lucide-react";
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
      <div className={cn("bg-white rounded-2xl overflow-hidden shadow-sm", className)}>
        {/* Floor tabs */}
        <div className="flex border-b border-neutral-200">
          {floors.map((floor, i) => (
            <button
              key={i}
              onClick={() => setActiveFloor(i)}
              className={cn(
                "px-6 py-4 text-sm font-semibold transition-colors",
                i === activeFloor
                  ? "border-b-2 border-brand-primary text-brand-primary"
                  : "text-neutral-600 hover:bg-neutral-100 transition-colors",
              )}
            >
              {floor.label}
            </button>
          ))}
        </div>

        {/* Floor plan image */}
        <div className="relative bg-neutral-50/50 flex items-center justify-center min-h-[360px] p-8">
          {current.imageUrl ? (
            <div className="relative w-full max-w-2xl">
              <Image
                src={current.imageUrl}
                alt={`${current.label} floor plan`}
                width={800}
                height={600}
                className="w-full h-auto opacity-80 grayscale contrast-125"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <Expand className="size-5 text-neutral-300" />
              </div>
              <span className="text-sm text-neutral-500">Floor plan not available</span>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-brand-primary shadow hover:bg-white transition-colors"
              onClick={() => setLightboxOpen(true)}
            >
              <Expand className="size-3.5" />
              Full Screen
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-8 pb-6 pt-4 flex flex-wrap gap-6 text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Interactive Viewpoint</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-neutral-300 rounded-sm" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Structure</span>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <div>
              <span className="text-xs font-medium tracking-widest uppercase text-white/50">
                Architectural Specifications
              </span>
              <h3 className="font-heading text-2xl font-bold text-white mt-0.5">
                Floor Plan
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Floor tabs in lightbox */}
              <div className="flex bg-white/10 p-1 rounded-xl">
                {floors.map((floor, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFloor(i)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      i === activeFloor
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    {floor.label}
                  </button>
                ))}
              </div>
              <button
                className="rounded-full p-2.5 bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex flex-1 items-center justify-center p-8 min-h-0">
            <div className="relative w-full max-w-5xl">
              {current.imageUrl ? (
                <Image
                  src={current.imageUrl}
                  alt={`${current.label} floor plan`}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain"
                  sizes="90vw"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="text-white/50 text-sm">Floor plan not available</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-center pb-6 shrink-0">
            <button className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest transition-colors">
              <Download className="size-4" />
              Download PDF Blueprint
            </button>
          </div>
        </div>
      )}
    </>
  );
}
