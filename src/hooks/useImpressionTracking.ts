"use client";

import { useEffect, useRef } from "react";

/**
 * Fires `onImpression` exactly once, when the element has been at least
 * `threshold` visible for `dwellMs` continuously. This is what makes a
 * placement impression meaningful — a card scrolled past in 100ms or rendered
 * off-screen never counts.
 */
export function useImpressionTracking<T extends HTMLElement>(
  onImpression: () => void,
  options?: { threshold?: number; dwellMs?: number },
) {
  const ref = useRef<T>(null);
  const firedRef = useRef(false);
  const threshold = options?.threshold ?? 0.5;
  const dwellMs = options?.dwellMs ?? 1000;

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= threshold) {
          timer = setTimeout(() => {
            if (!firedRef.current) {
              firedRef.current = true;
              onImpression();
              observer.disconnect();
            }
          }, dwellMs);
        } else if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: [threshold] },
    );

    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [onImpression, threshold, dwellMs]);

  return ref;
}
