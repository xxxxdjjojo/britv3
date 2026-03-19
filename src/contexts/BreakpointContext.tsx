"use client";

import { createContext, useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

type BreakpointState = {
  breakpoint: Breakpoint;
  isMobile: boolean;  // xs, sm (< 640px)
  isTablet: boolean;  // md, lg (640px–1023px)
  isDesktop: boolean; // xl, 2xl (>= 1024px — sidebar visible)
};

const BREAKPOINTS: { name: Breakpoint; minWidth: number }[] = [
  { name: "2xl", minWidth: 1536 },
  { name: "xl", minWidth: 1280 },
  { name: "lg", minWidth: 1024 },
  { name: "md", minWidth: 768 },
  { name: "sm", minWidth: 640 },
  { name: "xs", minWidth: 375 },
];

function resolveBreakpoint(width: number): Breakpoint {
  for (const bp of BREAKPOINTS) {
    if (width >= bp.minWidth) return bp.name;
  }
  return "xs";
}

function deriveState(bp: Breakpoint): BreakpointState {
  return {
    breakpoint: bp,
    isMobile: bp === "xs" || bp === "sm",
    isTablet: bp === "md" || bp === "lg",
    isDesktop: bp === "xl" || bp === "2xl",
  };
}

const DEFAULT_STATE = deriveState("xl");

export const BreakpointContext = createContext<BreakpointState>(DEFAULT_STATE);

export function BreakpointProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [bp, setBp] = useState<Breakpoint>("xl");

  useEffect(() => {
    setBp(resolveBreakpoint(window.innerWidth));

    const queries = BREAKPOINTS.map((b) =>
      window.matchMedia(`(min-width: ${b.minWidth}px)`),
    );

    const handleChange = () => {
      setBp(resolveBreakpoint(window.innerWidth));
    };

    for (const mql of queries) {
      mql.addEventListener("change", handleChange);
    }

    return () => {
      for (const mql of queries) {
        mql.removeEventListener("change", handleChange);
      }
    };
  }, []);

  const value = useMemo(() => deriveState(bp), [bp]);

  return (
    <BreakpointContext value={value}>
      {children}
    </BreakpointContext>
  );
}
