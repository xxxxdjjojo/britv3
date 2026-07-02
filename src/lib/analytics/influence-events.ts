import { trackEvent } from "@/lib/analytics/track-event";

/**
 * KPI analytics helpers for the Influence Strategy surfaces (tools, reports,
 * briefings, pledges). Thin wrappers over `trackEvent`, which is client-safe,
 * SSR-guarded, and never throws.
 */

export type ShareChannel = "whatsapp" | "copy_link" | "email";

export function trackToolStarted(tool: string): void {
  trackEvent("tool_started", { tool });
}

export function trackToolCompleted(
  tool: string,
  properties?: Record<string, unknown>,
): void {
  trackEvent("tool_completed", {
    tool,
    ...(properties as Record<string, string | number | boolean | null | undefined>),
  });
}

export function trackToolShared(tool: string, channel: ShareChannel): void {
  trackEvent("tool_shared", { tool, channel });
}

export function trackReportViewed(report: string): void {
  trackEvent("report_viewed", { report });
}

export function trackBriefingSubscribed(audience: string): void {
  trackEvent("briefing_subscribed", { audience });
}

export function trackPledgeViewed(pledge: string): void {
  trackEvent("pledge_viewed", { pledge });
}
