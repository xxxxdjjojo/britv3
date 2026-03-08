"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 60;
const MAX_PULL = 100;

export function PullToRefresh() {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only activate when page is scrolled to top
      if (window.scrollY > 0) return;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      if (window.scrollY > 0) {
        touchStartY.current = null;
        setPullDistance(0);
        return;
      }

      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta <= 0) return;

      // Clamp pull distance with diminishing returns past threshold
      const clamped = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(clamped);
    };

    const handleTouchEnd = async () => {
      if (touchStartY.current === null) return;
      touchStartY.current = null;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        router.refresh();
        // Allow spinner to show briefly before resetting
        setTimeout(() => setIsRefreshing(false), 1000);
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, router]);

  const isVisible = pullDistance > 8 || isRefreshing;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = isRefreshing ? undefined : progress * 360;

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center"
      style={{ height: isRefreshing ? 56 : Math.max(pullDistance, 0) }}
      aria-live="polite"
      aria-label={isRefreshing ? "Refreshing page" : "Pull to refresh"}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        style={{ opacity: isRefreshing ? 1 : progress }}
      >
        <RefreshCw
          size={20}
          className={`text-brand-primary ${isRefreshing ? "animate-spin" : ""}`}
          style={
            isRefreshing ? undefined : { transform: `rotate(${rotation}deg)` }
          }
        />
      </div>
    </div>
  );
}
