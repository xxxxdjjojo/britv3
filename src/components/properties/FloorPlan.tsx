"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, Expand, LayoutTemplate, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

type Floor = { label: string; imageUrl: string };

type FloorPlanProps = Readonly<{
  floors: Floor[];
  className?: string;
}>;

export function FloorPlan({ floors, className }: FloorPlanProps) {
  const [activeFloor, setActiveFloor] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const openLightbox = useCallback(() => {
    setLightboxOpen(true);
    setScale(1);
    history.pushState({ floorPlanLightbox: true }, "");
  }, []);

  const closeLightbox = useCallback(() => {
    if (window.history.state?.floorPlanLightbox) {
      window.history.back();
    } else {
      setLightboxOpen(false);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => setLightboxOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 3));
      else if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  if (floors.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-50 p-10 text-center", className)}>
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
      <div className={cn("rounded-2xl bg-neutral-50 p-5 space-y-4", className)}>
        {/* Floor switcher */}
        {floors.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {floors.map((floor, i) => (
              <button
                key={i}
                onClick={() => setActiveFloor(i)}
                aria-pressed={i === activeFloor}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px]",
                  i === activeFloor
                    ? "bg-brand-primary text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-100",
                )}
              >
                {floor.label}
              </button>
            ))}
          </div>
        )}

        {/* Floor plan image */}
        <div className="relative rounded-xl overflow-hidden bg-white">
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
            <button
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-md px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white transition-colors min-h-[44px]"
              onClick={openLightbox}
              aria-label="Expand floor plan"
            >
              <Expand className="size-4" aria-hidden="true" />
              Expand
            </button>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`${current.label} floor plan`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10">
            {/* Floor tabs */}
            {floors.length > 1 && (
              <div className="flex gap-2">
                {floors.map((floor, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFloor(i)}
                    aria-pressed={i === activeFloor}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px]",
                      i === activeFloor
                        ? "bg-white text-neutral-900"
                        : "bg-white/20 text-white hover:bg-white/30",
                    )}
                  >
                    {floor.label}
                  </button>
                ))}
              </div>
            )}
            {floors.length === 1 && (
              <span className="text-sm font-medium text-white">{current.label}</span>
            )}

            {/* Zoom + close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
                <button
                  className="rounded-full p-2 text-white hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-xs text-white/70 px-1 min-w-[3ch] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  className="rounded-full p-2 text-white hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
              </div>
              <button
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={closeLightbox}
                aria-label="Close floor plan"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Floor plan image with zoom */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-4 min-h-0">
            <div
              className="relative transition-transform duration-200 origin-center"
              style={{ transform: `scale(${scale})`, width: "min(90vw, 900px)", aspectRatio: "4/3" }}
            >
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
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center rounded-xl">
                  <p className="text-sm text-white/60">Floor plan not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Zoom hint */}
          <div className="pb-4 text-center">
            <span className="text-xs text-white/40">
              Use + / − keys or buttons above to zoom
            </span>
          </div>
        </div>
      )}
    </>
  );
}
