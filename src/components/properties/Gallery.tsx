"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImageIcon,
  Grid2X2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = { src: string; alt: string };

type GalleryProps = Readonly<{
  images: GalleryImage[];
  className?: string;
}>;

export function Gallery({ images, className }: GalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ lightbox: true }, "", "#gallery");
    }
  }, []);

  const closeLightbox = useCallback(() => {
    if (typeof window !== "undefined" && window.location.hash === "#gallery") {
      window.history.back();
    } else {
      setLightboxOpen(false);
    }
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handlePopState = () => setLightboxOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  useEffect(() => {
    if (lightboxOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [lightboxOpen]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  }, [next, prev]);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex h-80 items-center justify-center rounded-2xl bg-neutral-100",
          className,
        )}
      >
        <ImageIcon className="size-12 text-neutral-300" />
      </div>
    );
  }

  const currentImage = images[activeIndex];

  return (
    <>
      {/* ── Desktop: main + side grid ── */}
      <div className={cn("hidden md:block relative rounded-2xl overflow-hidden", className)}>
        <div className="grid grid-cols-[3fr_2fr] gap-0.5 h-[520px]">
          {/* Main large image */}
          <div
            className="relative cursor-pointer overflow-hidden group"
            onClick={() => openLightbox(0)}
            role="button"
            tabIndex={0}
            aria-label={`View photo 1 of ${images.length}`}
            onKeyDown={(e) => e.key === "Enter" && openLightbox(0)}
          >
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(min-width: 1280px) 900px, (min-width: 768px) 60vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Right: 2×2 grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden bg-neutral-100 group",
                  images[i] ? "cursor-pointer" : "",
                )}
                onClick={images[i] ? () => openLightbox(i) : undefined}
                role={images[i] ? "button" : undefined}
                tabIndex={images[i] ? 0 : undefined}
                aria-label={images[i] ? `View photo ${i + 1} of ${images.length}` : undefined}
                onKeyDown={images[i] ? (e) => e.key === "Enter" && openLightbox(i) : undefined}
              >
                {images[i] ? (
                  <>
                    <Image
                      src={images[i].src}
                      alt={images[i].alt}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes="(min-width: 768px) 20vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="w-full h-full bg-neutral-100" />
                )}
              </div>
            ))}

            {/* View all overlay */}
            {images.length > 4 && (
              <div
                className="relative overflow-hidden bg-neutral-900 cursor-pointer"
                onClick={() => openLightbox(4)}
                role="button"
                tabIndex={0}
                aria-label={`View all ${images.length} photos`}
                onKeyDown={(e) => e.key === "Enter" && openLightbox(4)}
              >
                {images[4] && (
                  <Image
                    src={images[4].src}
                    alt={images[4].alt}
                    fill
                    loading="lazy"
                    className="object-cover opacity-40"
                    sizes="20vw"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <Grid2X2 className="size-5 text-white" />
                  <span className="text-white text-xs font-semibold">
                    +{images.length - 4} more
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View all pill */}
        <button
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md px-4 py-2 text-sm font-semibold text-neutral-900 shadow-md hover:bg-white transition-colors min-h-[44px]"
          onClick={() => openLightbox(0)}
          aria-label={`View all ${images.length} photos`}
        >
          <Grid2X2 className="size-4" aria-hidden="true" />
          View all {images.length} photos
        </button>
      </div>

      {/* ── Mobile: carousel ── */}
      <div
        className={cn("md:hidden relative rounded-2xl overflow-hidden", className)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-72">
          <Image
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            fill
            priority={activeIndex === 0}
            loading={activeIndex === 0 ? undefined : "lazy"}
            className="object-cover"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
            {activeIndex + 1} / {images.length}
          </div>

          <button
            className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white min-h-[44px]"
            onClick={() => openLightbox(activeIndex)}
            aria-label={`View all ${images.length} photos`}
          >
            <Grid2X2 className="size-3.5" aria-hidden="true" />
            All photos
          </button>
        </div>

        {images.length > 1 && images.length <= 8 && (
          <div className="flex justify-center gap-1.5 py-2.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === activeIndex
                    ? "w-5 h-1.5 bg-brand-primary"
                    : "w-1.5 h-1.5 bg-neutral-300",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-neutral-950"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              ref={closeButtonRef}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close gallery"
              onClick={closeLightbox}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex flex-1 items-center justify-center relative min-h-0 px-14">
            <button
              className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={prev}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="relative w-full max-w-5xl aspect-[4/3]">
              {currentImage && (
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt}
                  fill
                  loading="lazy"
                  className="object-contain"
                  sizes="90vw"
                />
              )}
            </div>

            <button
              className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={next}
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="shrink-0 border-t border-white/10 py-3">
            <div className="flex gap-2 overflow-x-auto px-4 justify-start sm:justify-center">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-all duration-200 ring-2",
                    i === activeIndex
                      ? "ring-brand-primary opacity-100 scale-105"
                      : "ring-transparent opacity-50 hover:opacity-80",
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
        </div>
      )}
    </>
  );
}
