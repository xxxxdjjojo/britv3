"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function DashboardAnalytics(props: Readonly<{
  propertyCount: number;
  actionItemCount: number;
  isAllClear: boolean;
}>) {
  useEffect(() => {
    posthog.capture("landlord_dashboard_v2_loaded", {
      property_count: props.propertyCount,
      action_item_count: props.actionItemCount,
      is_all_clear: props.isAllClear,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
