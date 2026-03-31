"use client";

/**
 * PortfolioLightbox — Client Component
 *
 * "Invisible Estate" design: dark fullscreen overlay, image + project details
 * sidebar, keyboard navigation (left/right/escape), smooth transitions.
 *
 * Wraps a portfolio image item in a Dialog trigger. When clicked, opens
 * a full-size image lightbox using the Shadcn Dialog primitive.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type { PortfolioItem } from "@/types/providers";

type PortfolioLightboxProps = Readonly<{
  item: PortfolioItem;
  /** Optional: sibling items for prev/next navigation */
  siblings?: PortfolioItem[];
  /** Optional: index in siblings array */
  initialIndex?: number;
}>;

export function PortfolioLightbox({ item, siblings, initialIndex = 0 }: PortfolioLightboxProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const items = siblings ?? [item];
  const currentItem = items[currentIndex] ?? item;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  }, [hasPrev]);

  const goToNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  }, [hasNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, goToPrev, goToNext]);

  // Reset index when opening
  function handleOpen() {
    setCurrentIndex(initialIndex);
    setOpen(true);
  }

  return (
    <>
      {/* Thumbnail trigger */}
      <button
        type="button"
        className="w-full text-left [break-inside:avoid] mb-3 relative group cursor-pointer rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] focus-visible:ring-offset-2"
        onClick={handleOpen}
        aria-label={`View ${item.title} — full size`}
      >
        <Image
          src={item.image_url}
          alt={item.title}
          width={800}
          height={600}
          className="w-full object-cover rounded-2xl shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
          <div className="absolute top-3 right-3">
            <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white">
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="font-semibold text-sm truncate">{item.title}</p>
            {item.category && (
              <p className="text-xs text-white/70 mt-0.5">{item.category}</p>
            )}
          </div>
        </div>
      </button>

      {/* Fullscreen lightbox dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl w-full p-0 bg-[#0d1a16] rounded-2xl overflow-hidden shadow-2xl"
          aria-label={`Portfolio image: ${currentItem.title}`}
        >
          <DialogTitle className="sr-only">{currentItem.title}</DialogTitle>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-50 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex flex-col md:flex-row max-h-[90vh]">
            {/* Image panel */}
            <div className="relative flex-1 min-h-[300px] md:min-h-[500px] bg-black/60 flex items-center justify-center">
              <Image
                src={currentItem.image_url}
                alt={currentItem.title}
                width={1200}
                height={900}
                className="w-full h-full object-contain"
                style={{ maxHeight: "70vh" }}
              />

              {/* Navigation arrows */}
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrev}
                    disabled={!hasPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    disabled={!hasNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>

                  {/* Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                    {currentIndex + 1} / {items.length}
                  </div>
                </>
              )}
            </div>

            {/* Details sidebar */}
            {(currentItem.title || currentItem.description || currentItem.category) && (
              <div className="md:w-72 p-6 bg-[#111f19] flex flex-col gap-3">
                {currentItem.category && (
                  <span className="inline-flex self-start px-3 py-1 rounded-xl text-xs font-semibold bg-[#1B4D3E]/30 text-[#4ade80]">
                    {currentItem.category}
                  </span>
                )}
                <h3 className="text-lg font-bold font-heading tracking-tight text-white">
                  {currentItem.title}
                </h3>
                {currentItem.description && (
                  <p className="text-sm text-[#9ca3af] leading-relaxed">
                    {currentItem.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
