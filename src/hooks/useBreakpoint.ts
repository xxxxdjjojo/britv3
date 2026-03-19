"use client";

import { useContext } from "react";
import { BreakpointContext } from "@/contexts/BreakpointContext";
import type { Breakpoint } from "@/contexts/BreakpointContext";

export type { Breakpoint };

export function useBreakpoint() {
  return useContext(BreakpointContext);
}
