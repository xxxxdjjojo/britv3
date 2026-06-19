"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

type Props = {
  event: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

/** Fires a privacy-safe analytics event once when mounted (for server pages). */
export function TrackOnMount({ event, properties }: Props) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, properties);
  }, [event, properties]);
  return null;
}
