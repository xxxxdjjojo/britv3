"use client";

import { useEffect } from "react";

import { trackPledgeViewed } from "@/lib/analytics/influence-events";

/** Fires the pledge_viewed KPI event once on mount. Renders nothing. */
export function PledgeViewTracker({ slug }: Readonly<{ slug: string }>) {
  useEffect(() => {
    trackPledgeViewed(slug);
  }, [slug]);

  return null;
}
