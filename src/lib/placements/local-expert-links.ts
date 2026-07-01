/**
 * local-expert-links.ts
 *
 * Pure URL builders for the Local Vetted Traders section. Kept separate so the
 * "Request Quote pre-fills listing / category / trader / source" contract is
 * unit-testable without rendering a component.
 */

import type { LocalExpert } from "@/types/local-experts";

/** Saved on the RFQ as `source` for property → trader attribution. */
export const LOCAL_TRADERS_SOURCE = "property_detail_local_traders";

export type QuoteLinkContext = {
  listingId?: string | null;
  postcode?: string | null;
  address?: string | null;
};

/**
 * Deep-link into the existing RFQ flow, pre-filling the trade category, the
 * specific trader, the originating listing, and the source surface.
 */
export function buildQuoteHref(expert: LocalExpert, ctx: QuoteLinkContext): string {
  const params = new URLSearchParams();
  params.set("category", expert.category ?? "other");
  params.set("provider", expert.providerId);
  params.set("source", LOCAL_TRADERS_SOURCE);
  if (ctx.listingId) params.set("listing", ctx.listingId);
  if (ctx.postcode) params.set("postcode", ctx.postcode);
  if (ctx.address) params.set("address", ctx.address);
  return `/dashboard/rfqs/create?${params.toString()}`;
}

/** Canonical public provider profile route: /services/{category}/{slug}. */
export function buildProfileHref(expert: LocalExpert): string {
  return `/services/${expert.category ?? "other"}/${expert.slug}`;
}

/** "View all local experts" — the filter-aware tradespeople directory. */
export function buildViewAllHref(ctx: { postcode?: string | null; category?: string | null }): string {
  const params = new URLSearchParams();
  if (ctx.postcode) params.set("postcode", ctx.postcode);
  if (ctx.category) params.set("category", ctx.category);
  const qs = params.toString();
  return qs ? `/services/tradespeople?${qs}` : "/services/tradespeople";
}
