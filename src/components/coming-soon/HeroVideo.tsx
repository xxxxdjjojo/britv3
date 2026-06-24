"use client";

import { useSyncExternalStore } from "react";

const POSTER = "/images/coming-soon/hero-poster.jpg";
const VIDEO = "/videos/coming-soon-hero.mp4";
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export function HeroVideo() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-[#04130C]">
      {reducedMotion ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={POSTER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={VIDEO} type="video/mp4" />
        </video>
      )}

      {/* Cinematic green wash + vertical falloff for legible text. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,19,12,0.45) 0%, rgba(4,19,12,0.82) 100%)",
        }}
      />
      {/* Radial vignette to pull focus to centre. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 38%, transparent 0%, transparent 42%, rgba(4,19,12,0.65) 100%)",
        }}
      />
    </div>
  );
}
