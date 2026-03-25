"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <>
      {/* Desktop: 2+2 grid */}
      <div className={cn("hidden md:block relative rounded-xl overflow-hidden", className)}>
        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[480px]">
          {/* Main large image */}
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
              className="relative cursor-pointer overflow-hidden bg-neutral-200"
              onClick={() => openLightbox(Math.min(i, images.length - 1))}
            >
              {images[i] ? (
                <Image
                  src={images[i].src}
                  alt={images[i].alt}
                  fill
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
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          {/* Close */}
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 z-10"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="size-5" />
          </button>

          {/* Main image */}
          <div className="flex flex-1 items-center justify-center relative px-12">
            <button
              className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={prev}
              aria-label="Previous"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="relative w-full max-w-4xl aspect-[4/3]">
              <Image
                src={images[activeIndex].src}
                alt={images[activeIndex].alt}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            <button
              className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={next}
              aria-label="Next"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-2 justify-center">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
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
