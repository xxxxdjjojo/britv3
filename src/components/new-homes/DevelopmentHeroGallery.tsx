"use client";

import { useState } from "react";
import { DevelopmentVisual } from "./DevelopmentVisual";
import type { DevelopmentMedia } from "@/lib/new-homes/types";

// Immersive hero. Uses gallery images when present; otherwise renders branded
// visuals so the page never looks broken during the pilot (no hosted CGIs yet).
export function DevelopmentHeroGallery({
  media,
  heroImageUrl,
  brandColour,
  name,
}: Readonly<{
  media: DevelopmentMedia[];
  heroImageUrl: string | null;
  brandColour: string | null;
  name: string;
}>) {
  const images = media.filter((m) => m.mediaType === "image");
  const slides = images.length > 0
    ? images.map((m) => m.url)
    : [heroImageUrl, `${brandColour ?? "#1B4D3E"}::1`, `${brandColour ?? "#1B4D3E"}::2`];
  const [active, setActive] = useState(0);
  const current = slides[active] ?? null;
  const currentUrl = current && current.includes("::") ? null : current;

  return (
    <div className="overflow-hidden">
      <div className="grid gap-2 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <DevelopmentVisual
            imageUrl={currentUrl}
            brandColour={brandColour}
            name={name}
            priority
            sizes="(max-width: 1024px) 100vw, 75vw"
            className="aspect-[16/9] w-full rounded-2xl"
          />
        </div>
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-1">
          {slides.slice(0, 4).map((slide, i) => {
            const url = slide && slide.includes("::") ? null : slide;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={active === i}
                className={
                  "overflow-hidden rounded-xl ring-2 transition-all " +
                  (active === i ? "ring-brand-primary" : "ring-transparent hover:ring-neutral-300")
                }
              >
                <DevelopmentVisual
                  imageUrl={url}
                  brandColour={brandColour}
                  name={name}
                  className="aspect-[4/3] w-full lg:aspect-[16/9]"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
