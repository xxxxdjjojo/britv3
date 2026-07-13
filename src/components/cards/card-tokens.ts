/**
 * Shared card design tokens.
 *
 * Consume these constants in property-card variants, stat/KPI cards, and any
 * other card-like surface so the system converges to a single visual tier
 * without merging separate components into one.
 *
 * Usage:
 *   import { CARD_SURFACE, CARD_IMAGE_ASPECT, CARD_RADIUS } from "@/components/cards/card-tokens";
 *   className={CARD_SURFACE}
 */

/** 16:10 photo ratio — matches the MapPropertyCard hero and aligns the grid. */
export const CARD_IMAGE_ASPECT = "aspect-[16/10]";

/** Shared corner radius across all card shells. */
export const CARD_RADIUS = "rounded-xl";

/**
 * Resting flat card shell with a gentle lift on hover.
 * Includes bg, radius, border, and shadow transition in one token.
 */
export const CARD_SURFACE =
  "bg-card rounded-xl border shadow-sm transition-shadow hover:shadow-md";

/**
 * Absolute-positioned badge — top-left corner of the image area.
 * Apply to the wrapper that positions the badge, not the badge itself.
 */
export const CARD_BADGE_PLACEMENT = "absolute left-3 top-3 z-10";

/**
 * Absolute-positioned save/heart button — top-right corner of the image area.
 * Apply to the wrapper that positions the button.
 */
export const CARD_SAVE_BTN_PLACEMENT = "absolute right-3 top-3 z-10";
