"use client";

import { useEffect, useState, useRef } from "react";

type ScrollDirection = "up" | "down" | null;

/**
 * Detects scroll direction with a threshold to avoid jitter.
 * Returns "up" when user scrolls up, "down" when scrolling down, null initially.
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateDirection = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      setDirection(diff > 0 ? "down" : "up");
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return direction;
}
