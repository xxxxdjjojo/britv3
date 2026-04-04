"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImageIcon,
  GalleryThumbnails,
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

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") closeLightbox();
    },
    [prev, next, closeLightbox],
  );

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[400px] items-center justify-center rounded-2xl bg-neutral-100",
          className,
        )}
      >
        <ImageIcon className="size-12 text-neutral-300" />
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Stitch-style 4-panel mosaic */}
      <div
        className={cn(
          "hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[520px] rounded-2xl overflow-hidden relative",
          className,
        )}
      >
        {/* Main hero image (col-span-2, row-span-2) */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={images[0].src}
            alt={images[0].alt}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
        </div>

        {/* Top-right (col-span-1, row-span-1) */}
        <div
          className="relative cursor-pointer overflow-hidden group bg-neutral-100"
          onClick={() => openLightbox(1)}
        >
          {images[1] ? (
            <Image
              src={images[1].src}
              alt={images[1].alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="25vw"
            />
          ) : (
            <div className="w-full h-full bg-neutral-100" />
          )}
        </div>

        {/* Top-right second (col-span-1, row-span-1) */}
        <div
          className="relative cursor-pointer overflow-hidden group bg-neutral-100"
          onClick={() => openLightbox(2)}
        >
          {images[2] ? (
            <Image
              src={images[2].src}
              alt={images[2].alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="25vw"
            />
          ) : (
            <div className="w-full h-full bg-neutral-100" />
          )}
        </div>

        {/* Bottom-right spanning 2 cols */}
        <div
          className="col-span-2 relative cursor-pointer overflow-hidden group bg-neutral-100"
          onClick={() => openLightbox(3)}
        >
          {images[3] ? (
            <Image
              src={images[3].src}
              alt={images[3].alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="50vw"
            />
          ) : (
            <div className="w-full h-full bg-neutral-100" />
          )}
        </div>

        {/* View all button */}
        <button
          className="absolute bottom-5 right-5 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-semibold text-brand-primary shadow-lg hover:bg-white transition-all"
          onClick={() => openLightbox(0)}
        >
          <GalleryThumbnails className="size-4" />
          View All {images.length} Photos
        </button>
      </div>

      {/* Mobile: single image carousel */}
      <div className={cn("md:hidden relative rounded-2xl overflow-hidden", className)}>
        <div className="relative h-72">
          <Image
            src={images[activeIndex].src}
            alt={images[activeIndex].alt}
            fill
            className="object-cover"
            sizes="100vw"
          />

          {/* Arrow buttons */}
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-4 text-neutral-900" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight className="size-4 text-neutral-900" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-3 right-3 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-neutral-900">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* Lightbox — Stitch-style fullscreen gallery */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <div className="flex flex-col">
              <span className="text-xs font-medium tracking-widest uppercase text-white/50">
                Gallery
              </span>
              <span className="font-heading text-xl font-light text-white">
                {activeIndex + 1}{" "}
                <span className="text-white/40">/</span>{" "}
                {images.length}
              </span>
            </div>
            <button
              className="rounded-full p-2.5 bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={closeLightbox}
              aria-label="Close gallery"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex flex-1 items-center justify-center relative px-16 min-h-0">
            <button
              className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={prev}
              aria-label="Previous"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="relative w-full max-w-5xl h-full">
              <Image
                src={images[activeIndex].src}
                alt={images[activeIndex].alt}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            <button
              className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              onClick={next}
              aria-label="Next"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto px-6 pb-6 pt-4 justify-center hide-scrollbar shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all",
                  i === activeIndex
                    ? "ring-2 ring-white opacity-100"
                    : "opacity-40 hover:opacity-80",
                )}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
