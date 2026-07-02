"use client";

import { useEffect } from "react";
import { captureFirstTouch } from "@/lib/analytics/signup-attribution";

/**
 * Captures first-touch attribution (UTM params, referrer, landing path) on the
 * visitor's first page view. Renders nothing.
 */
export function FirstTouchTracker() {
  useEffect(() => {
    captureFirstTouch();
  }, []);

  return null;
}
