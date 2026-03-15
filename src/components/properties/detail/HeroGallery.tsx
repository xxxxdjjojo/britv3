"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Home, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryImage = { src: string; alt: string };

type HeroGalleryProps = Readonly<{
  images: Array<GalleryImage>;
  highlightText?: string | null;
  className?: string;
}>;

export function HeroGallery({ images, highlightText, className }: HeroGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // -------------------------------------------------------------------------
  // Lightbox open / close with history shim (back button fix)
  // -------------------------------------------------------------------------

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    history.pushState({ lightboxOpen: true }, "");
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      if (lightboxOpen && !(e.state as { lightboxOpen?: boolean } | null)?.lightboxOpen) {
        setLightboxOpen(false);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [lightboxOpen]);

  // -------------------------------------------------------------------------
  // Keyboard navigation in lightbox
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % images.length);
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, images.length, closeLightbox]);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex h-80 flex-col items-center justify-center gap-3 rounded-xl bg-neutral-100 border",
          className,
        )}
      >
        <Home className="size-12 text-neutral-300" />
        <p className="text-sm text-muted-foreground">No photos available</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Desktop layout: main image (left) + 2 thumbnails (right column)
  // -------------------------------------------------------------------------

  const thumb1 = images[1] ?? null;
  const thumb2 = images[2] ?? null;

  return (
    <>
      {/* Desktop: large left + 2-thumbnail right column */}
      <div className={cn("hidden md:block relative rounded-xl overflow-hidden", className)}>
        <div className="grid grid-cols-[1fr_220px] gap-1 h-[440px]">
          {/* Main image */}
          <div
            className="relative cursor-pointer overflow-hidden group"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              priority
              loading="eager"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(min-width: 768px) 65vw, 100vw"
            />

            {/* AI Highlights chip */}
            {highlightText && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium shadow-sm border border-border/50 max-w-[260px]">
                <span>✨</span>
                <span className="truncate">{highlightText}</span>
              </div>
            )}
          </div>

          {/* Right thumbnail column */}
          <div className="flex flex-col gap-1">
            {/* Thumb 1 */}
            <div
              className={cn(
                "relative flex-1 overflow-hidden cursor-pointer bg-neutral-200",
                !thumb1 && "pointer-events-none",
              )}
              onClick={() => thumb1 && openLightbox(1)}
            >
              {thumb1 ? (
                <Image
                  src={thumb1.src}
                  alt={thumb1.alt}
                  fill
                  loading="lazy"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="220px"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
            </div>

            {/* Thumb 2 */}
            <div
              className={cn(
                "relative flex-1 overflow-hidden cursor-pointer bg-neutral-200",
                !thumb2 && "pointer-events-none",
              )}
              onClick={() => thumb2 && openLightbox(2)}
            >
              {thumb2 ? (
                <Image
                  src={thumb2.src}
                  alt={thumb2.alt}
                  fill
                  loading="lazy"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="220px"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
            </div>
          </div>
        </div>

        {/* Show all photos button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-3 right-3 gap-1.5 shadow-md"
          onClick={() => openLightbox(0)}
        >
          <Images className="size-4" />
          Show all {images.length} photos
        </Button>
      </div>

      {/* Mobile: single image carousel */}
      <div className={cn("md:hidden relative rounded-xl overflow-hidden", className)}>
        <div className="relative h-64">
          <Image
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            fill
            priority={activeIndex === 0}
            loading={activeIndex === 0 ? "eager" : "lazy"}
            className="object-cover"
            sizes="100vw"
          />

          {/* AI Highlights chip on mobile */}
          {highlightText && activeIndex === 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium shadow-sm border border-border/50 max-w-[220px]">
              <span>✨</span>
              <span className="truncate">{highlightText}</span>
            </div>
          )}

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
                onClick={prev}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
                onClick={next}
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          {/* Counter + open lightbox */}
          <button
            className="absolute bottom-2 right-3 rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-medium"
            onClick={() => openLightbox(activeIndex)}
            aria-label="View all photos"
          >
            {activeIndex + 1} / {images.length}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Lightbox                                                             */}
      {/* ------------------------------------------------------------------ */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          className="fixed inset-0 z-50 bg-black/92 flex flex-col"
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 z-10"
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            <X className="size-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm z-10">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Main image */}
          <div className="flex flex-1 items-center justify-center relative px-14">
            <button
              className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={prev}
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="relative w-full max-w-4xl aspect-[4/3]">
              <Image
                src={images[activeIndex].src}
                alt={images[activeIndex].alt}
                fill
                loading="lazy"
                className="object-contain"
                sizes="90vw"
              />
            </div>

            <button
              className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={next}
              aria-label="Next photo"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-2 justify-center shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                  i === activeIndex
                    ? "border-white"
                    : "border-transparent opacity-50 hover:opacity-80",
                )}
                aria-label={`Go to photo ${i + 1}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
