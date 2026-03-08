"use client";

/**
 * Property image gallery with main image, thumbnail strip, and full-screen lightbox.
 * Mobile: swipeable main image via CSS scroll-snap.
 */

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  ImageIcon,
  LayoutPanelLeftIcon,
} from "lucide-react";
import type { PropertyMedia } from "@/types/property";

type PropertyGalleryProps = Readonly<{
  photos: PropertyMedia[];
  floorPlans: PropertyMedia[];
}>;

export function PropertyGallery({ photos, floorPlans }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tab, setTab] = useState<"photos" | "floorplans">("photos");

  const images = tab === "photos" ? photos : floorPlans;
  const activeImage = images[activeIndex];

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle keyboard navigation in lightbox
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setLightboxOpen(false);
    },
    [goNext, goPrev],
  );

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-muted md:h-96">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="size-12" />
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tab toggle (photos / floor plans) */}
      {floorPlans.length > 0 && (
        <div className="mb-3 flex gap-2">
          <Button
            variant={tab === "photos" ? "default" : "outline"}
            size="sm"
            onClick={() => { setTab("photos"); setActiveIndex(0); }}
            className="gap-1.5"
          >
            <ImageIcon className="size-4" />
            Photos ({photos.length})
          </Button>
          <Button
            variant={tab === "floorplans" ? "default" : "outline"}
            size="sm"
            onClick={() => { setTab("floorplans"); setActiveIndex(0); }}
            className="gap-1.5"
          >
            <LayoutPanelLeftIcon className="size-4" />
            Floor Plans ({floorPlans.length})
          </Button>
        </div>
      )}

      {/* Main image -- mobile swipeable */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Mobile: scroll-snap gallery */}
        <div className="flex snap-x snap-mandatory overflow-x-auto md:hidden">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="aspect-[16/10] w-full shrink-0 snap-center"
            >
              <Image
                src={img.url}
                alt={img.alt_text || `Property image ${i + 1}`}
                width={800}
                height={500}
                className="h-full w-full object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Desktop: single main image */}
        <div
          className="hidden cursor-pointer md:block"
          onClick={() => setLightboxOpen(true)}
        >
          <div className="relative aspect-[16/9]">
            {activeImage && (
              <Image
                src={activeImage.url}
                alt={activeImage.alt_text || "Property image"}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            )}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
            {activeIndex + 1} of {images.length}
          </div>
        </div>
      </div>

      {/* Thumbnail strip -- desktop only */}
      {images.length > 1 && (
        <div className="mt-2 hidden gap-2 overflow-x-auto md:flex">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                i === activeIndex
                  ? "border-primary ring-1 ring-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.thumbnail_url || img.url}
                alt={img.alt_text || `Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <XIcon className="size-6" />
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-4 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white">
            {activeIndex + 1} of {images.length}
          </div>

          {/* Main image */}
          {activeImage && (
            <div className="relative h-[80vh] w-[90vw]">
              <Image
                src={activeImage.url}
                alt={activeImage.alt_text || "Property image"}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          )}

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-8" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-8" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
