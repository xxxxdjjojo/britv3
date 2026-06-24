"use client";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useEffect, useState } from "react";

const BP_COLORS: Record<string, string> = {
  xs: "bg-red-500",
  sm: "bg-orange-500",
  md: "bg-yellow-500",
  lg: "bg-green-500",
  xl: "bg-blue-500",
  "2xl": "bg-purple-500",
};

/**
 * Dev-only breakpoint indicator badge.
 * Also logs a console warning if the page has horizontal overflow.
 */
export function DevBreakpointIndicator() {
  const { breakpoint } = useBreakpoint();
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read viewport width once on mount
    setWidth(window.innerWidth);
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const check = () => {
      if (document.documentElement.scrollWidth > window.innerWidth) {
        console.warn(
          `[Responsive] Horizontal overflow detected: page is ${document.documentElement.scrollWidth}px wide, viewport is ${window.innerWidth}px`,
        );
      }
    };

    const timer = setTimeout(check, 1000);
    window.addEventListener("resize", check);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className={`fixed bottom-20 right-4 z-[9999] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg lg:bottom-4 ${BP_COLORS[breakpoint] ?? "bg-gray-500"}`}
    >
      <span className="size-2 animate-pulse rounded-full bg-white/50" />
      {breakpoint}
      {width !== null && (
        <span className="text-white/70">{width}px</span>
      )}
    </div>
  );
}
