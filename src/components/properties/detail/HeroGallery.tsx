"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  src: string;
  alt: string;
  aiHighlight?: string;
};

type HeroGalleryProps = Readonly<{
  images: GalleryImage[];
  propertyTitle: string;
  className?: string;
}>;

export function HeroGallery({ images, propertyTitle, className }: HeroGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ lightbox: true }, "", "#gallery");
    }
  }, []);

  const closeLightbox = useCallback(() => {
    if (typeof window !== "undefined" && window.location.hash === "#gallery") {
      window.history.back(); // popstate handler will call setLightboxOpen(false)
    } else {
      setLightboxOpen(false); // fallback if history not available
    }
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Close lightbox when browser back button is pressed
  useEffect(() => {
    const handlePopState = () => {
      setLightboxOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []); // No dependency on lightboxOpen needed

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, prev, next, closeLightbox]);

  // Focus close button when lightbox opens
  useEffect(() => {
    if (lightboxOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [lightboxOpen]);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex h-80 items-center justify-center rounded-xl bg-neutral-200",
          className,
        )}
      >
        <ImageIcon className="size-12 text-neutral-400" />
      </div>
    );
  }

  const currentImage = images[activeIndex];

  return (
    <>
      {/* Desktop: 2+2 grid */}
      <div className={cn("hidden md:block relative rounded-xl overflow-hidden", className)}>
        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[480px]">
          {/* Main large image — priority for LCP */}
          <div
            className="row-span-2 relative cursor-pointer overflow-hidden"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              priority
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>

          {/* Three thumbnails (or placeholders) */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden bg-neutral-200",
                images[i] ? "cursor-pointer" : "",
              )}
              onClick={images[i] ? () => openLightbox(i) : undefined}
            >
              {images[i] ? (
                <Image
                  src={images[i].src}
                  alt={images[i].alt}
                  fill
                  loading="lazy"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
            </div>
          ))}
        </div>

        {/* View all button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-3 right-3 gap-1.5 shadow-md"
          onClick={() => openLightbox(0)}
        >
          View All {images.length} Photos
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
            loading={activeIndex === 0 ? undefined : "lazy"}
            className="object-cover"
            sizes="100vw"
          />

          {/* Arrow buttons */}
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

          {/* Counter */}
          <div className="absolute bottom-2 right-3 rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-medium">
            {activeIndex + 1} of {images.length}
          </div>
        </div>

        {/* Mobile: view all button */}
        <div className="absolute bottom-2 left-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 shadow-md text-xs h-7"
            onClick={() => openLightbox(activeIndex)}
          >
            View All {images.length} Photos
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0c0b]"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo gallery for ${propertyTitle}`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            {/* Counter badge */}
            <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
              {activeIndex + 1} / {images.length}
            </div>

            {/* Top-right controls */}
            <div className="flex items-center gap-2">
              <button
                ref={closeButtonRef}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                aria-label="Close gallery"
                onClick={closeLightbox}
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Main image area */}
          <div className="flex flex-1 items-center justify-center relative px-12 min-h-0">
            <button
              className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
              onClick={prev}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="relative w-full max-w-4xl aspect-[4/3]">
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                fill
                loading="lazy"
                className="object-contain"
                sizes="90vw"
              />

              {/* AI Highlight overlay */}
              {currentImage.aiHighlight && (
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 backdrop-blur-sm border border-teal-700/30 p-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-4 shrink-0 text-[color:var(--color-brand-secondary)]" />
                    <span className="text-xs font-medium text-teal-200">
                      TrueDeed AI Highlight
                    </span>
                  </div>
                  <p className="mt-1 text-sm italic text-white/90">
                    {currentImage.aiHighlight}
                  </p>
                </div>
              )}
            </div>

            <button
              className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
              onClick={next}
              aria-label="Next image"
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
                aria-label={`View image ${i + 1}: ${img.alt}`}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                  i === activeIndex
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
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
