"use client";

/**
 * track-placement-event.ts
 *
 * Client helper that records a placement analytics event two ways: PostHog
 * (product analytics, using the spec's canonical event names) and a durable
 * server beacon to /api/placements/events (counter increments + audit).
 */

import { trackEvent } from "@/lib/analytics/track-event";
import type { PlacementEventType, PlacementZone } from "@/types/sponsored-placements";

const POSTHOG_EVENT_NAMES: Record<PlacementEventType, string> = {
  impression: "placement_impression",
  click: "placement_click",
  profile_view: "trader_profile_view",
  enquiry_started: "quote_request_started",
  enquiry_submitted: "quote_request_submitted",
};

const SESSION_KEY = "td_placement_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export type TrackPlacementEventInput = {
  placementId: string;
  eventType: PlacementEventType;
  zone?: PlacementZone | null;
  propertyId?: string | null;
  providerId?: string | null;
};

export function trackPlacementEvent(input: TrackPlacementEventInput): void {
  if (typeof window === "undefined") return;

  trackEvent(POSTHOG_EVENT_NAMES[input.eventType], {
    placement_id: input.placementId,
    provider_id: input.providerId ?? null,
    zone: input.zone ?? null,
    property_id: input.propertyId ?? null,
  });

  try {
    void fetch("/api/placements/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        placementId: input.placementId,
        eventType: input.eventType,
        zone: input.zone ?? null,
        propertyId: input.propertyId ?? null,
        sessionId: getSessionId(),
      }),
    });
  } catch {
    // Analytics must never break the UI.
  }
}
