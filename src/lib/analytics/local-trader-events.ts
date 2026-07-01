"use client";

/**
 * local-trader-events.ts
 *
 * Client analytics for the property page's "Local experts" section. Fires the
 * spec's PostHog events, and for sponsored cards ALSO writes the durable
 * placement beacon (so admin impression/click/enquiry counters stay accurate).
 */

import { trackEvent } from "@/lib/analytics/track-event";
import { trackPlacementEvent } from "@/lib/placements/track-placement-event";
import type { PlacementZone } from "@/types/sponsored-placements";

export type LocalTraderContext = {
  propertyId?: string | null;
  listingId?: string | null;
  zone: PlacementZone;
};

export type LocalTraderCardRef = {
  providerId: string;
  placementId: string | null;
  isSponsored: boolean;
  category: string | null;
};

function cardProps(card: LocalTraderCardRef, ctx: LocalTraderContext) {
  return {
    provider_id: card.providerId,
    placement_id: card.placementId,
    category: card.category,
    sponsored: card.isSponsored,
    property_id: ctx.propertyId ?? null,
    listing_id: ctx.listingId ?? null,
    zone: ctx.zone,
  };
}

export function trackLocalTradersSectionViewed(ctx: LocalTraderContext, count: number): void {
  trackEvent("local_traders_section_viewed", {
    property_id: ctx.propertyId ?? null,
    listing_id: ctx.listingId ?? null,
    zone: ctx.zone,
    card_count: count,
  });
}

export function trackLocalTraderCardViewed(card: LocalTraderCardRef, ctx: LocalTraderContext): void {
  trackEvent("local_trader_card_viewed", cardProps(card, ctx));
  if (card.isSponsored) {
    trackEvent("sponsored_trader_impression", cardProps(card, ctx));
    if (card.placementId) {
      trackPlacementEvent({
        placementId: card.placementId,
        providerId: card.providerId,
        eventType: "impression",
        zone: ctx.zone,
        propertyId: ctx.propertyId,
      });
    }
  }
}

export type LocalTraderClickKind = "quote" | "profile";

export function trackLocalTraderClicked(
  card: LocalTraderCardRef,
  ctx: LocalTraderContext,
  kind: LocalTraderClickKind,
): void {
  trackEvent("local_trader_clicked", { ...cardProps(card, ctx), action: kind });

  if (card.isSponsored) {
    trackEvent("sponsored_trader_click", { ...cardProps(card, ctx), action: kind });
    if (card.placementId) {
      trackPlacementEvent({
        placementId: card.placementId,
        providerId: card.providerId,
        eventType: kind === "profile" ? "profile_view" : "click",
        zone: ctx.zone,
        propertyId: ctx.propertyId,
      });
    }
  }

  if (kind === "quote") {
    trackEvent("local_trader_quote_requested", cardProps(card, ctx));
    trackEvent("property_to_trader_conversion", cardProps(card, ctx));
    if (card.isSponsored && card.placementId) {
      trackPlacementEvent({
        placementId: card.placementId,
        providerId: card.providerId,
        eventType: "enquiry_started",
        zone: ctx.zone,
        propertyId: ctx.propertyId,
      });
    }
  }
}
