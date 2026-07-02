"use client";

import { useEffect } from "react";

import { trackReportViewed } from "@/lib/analytics/influence-events";

/**
 * Fires the report_viewed KPI event once on mount (e.g.
 * "reality_gap:2026-Q2"). Renders nothing. Follows PledgeViewTracker.
 */
export function ReportViewTracker({ report }: Readonly<{ report: string }>) {
  useEffect(() => {
    trackReportViewed(report);
  }, [report]);

  return null;
}
