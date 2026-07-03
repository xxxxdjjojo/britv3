/**
 * Central configuration for every Top Properties list. This file is the
 * single source of truth for slugs, copy, and indexability thresholds —
 * pages, the sitemap, the homepage module, and structured data all read
 * from here so a category can never be half-wired.
 *
 * Copy rules (see docs/TOP_PROPERTIES.md):
 *  - Valuation-led lists never say "undervalued" — the honest signal is
 *    asking price vs the HM Land Registry sold-price benchmark, so the copy
 *    says "below the local benchmark".
 *  - Every methodology string states exactly what is counted. No invented
 *    recency windows, no fabricated signals.
 */

import type { TopListCategory } from "@/lib/top-properties/types";

/** A list page is indexable only with at least this many real properties. */
export const MIN_ITEMS_TO_INDEX = 5;

/** Items shown on the full list page. */
export const LIST_PAGE_SIZE = 20;

/** Items shown per card on the homepage / hub. */
export const CARD_PREVIEW_SIZE = 3;

/**
 * Shared disclaimer rendered with every methodology block.
 * Rankings must never read as financial advice.
 */
export const TOP_LIST_DISCLAIMER =
  "Rankings are calculated from TrueDeed listing data, HM Land Registry sold-price benchmarks, buyer engagement on TrueDeed, and available property attributes. They are refreshed regularly and are not financial advice.";

export const TOP_LIST_CATEGORIES: readonly TopListCategory[] = [
  {
    slug: "below-local-benchmark",
    kind: "value",
    title: "Homes priced below the local benchmark",
    shortTitle: "Below local benchmark",
    metaTitle: "Homes Priced Below the Local Benchmark",
    metaDescription:
      "Homes for sale asking less than the HM Land Registry sold-price benchmark for their area. Compare asking prices with what nearby homes actually sold for.",
    intro:
      "These homes are asking less than the median sold price for comparable property types in their local area, based on HM Land Registry transactions. A lower asking price can reflect condition, tenure, or a motivated seller — always view before you judge.",
    methodology:
      "We compare each home's asking price with the median sold price for its property type (flat or house) in the surrounding area, computed from HM Land Registry price-paid records. A home appears here only when that benchmark is built from enough recent sales to be meaningful, and homes are ordered by how far their asking price sits below it.",
    badgeLabel: "Below local benchmark",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "best-price-per-square-foot",
    kind: "ppsf",
    title: "Best price per square foot",
    shortTitle: "Best £ per sq ft",
    metaTitle: "Best Price per Square Foot",
    metaDescription:
      "Homes for sale offering the most floor space for the money, ranked by asking price per square foot from real listing data.",
    intro:
      "Price per square foot is one of the cleanest ways to compare homes of different shapes and sizes. These listings offer the most space for the money right now, ranked from their stated internal floor area and asking price.",
    methodology:
      "We divide each home's asking price by its stated internal floor area in square feet and rank from the lowest to the highest. Only homes with a recorded floor area appear — we never estimate the size of a home to force it onto the list.",
    badgeLabel: "Price per sq ft",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "strongest-buyer-interest",
    kind: "interest",
    title: "Homes with the strongest buyer interest",
    shortTitle: "Strongest buyer interest",
    metaTitle: "Homes With the Strongest Buyer Interest",
    metaDescription:
      "The homes buyers are viewing, saving, and enquiring about most on TrueDeed right now.",
    intro:
      "Buyer attention is a real market signal. These are the homes generating the most engagement on TrueDeed — the listings buyers keep coming back to, save to their shortlists, and enquire about.",
    methodology:
      "Each home is scored from its total page views, saves, and enquiries on TrueDeed, with saves weighted double and views and enquiries weighted once (on a logarithmic scale, so one viral listing cannot drown out the rest). Counts are lifetime totals for the current listing.",
    badgeLabel: "Buyer interest",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "most-saved-homes",
    kind: "saved",
    title: "Most saved homes",
    shortTitle: "Most saved",
    metaTitle: "Most Saved Homes",
    metaDescription:
      "The homes buyers save to their shortlists most on TrueDeed — a strong signal of serious interest.",
    intro:
      "Saving a home is a stronger signal than viewing one — it means a buyer wants to come back. These are the most-shortlisted homes for sale on TrueDeed right now.",
    methodology:
      "Homes are ranked by the total number of times buyers have saved the listing on TrueDeed. Only homes that have been saved at least once appear.",
    badgeLabel: "Saves",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "newly-listed-homes",
    kind: "newest",
    title: "Newly listed homes",
    shortTitle: "Newly listed",
    metaTitle: "Newly Listed Homes",
    metaDescription:
      "The newest homes for sale on TrueDeed, freshest first. Be the first through the door.",
    intro:
      "Fresh to the market. These homes were listed most recently on TrueDeed — if you have a search running, these are the ones worth an early viewing before the crowd arrives.",
    methodology:
      "Homes are ordered by the date the listing went live on TrueDeed, newest first. No other signal is applied — a home's position here reflects nothing but how recently it came to market.",
    badgeLabel: "Listed",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "largest-homes",
    kind: "largest",
    title: "Largest homes for sale",
    shortTitle: "Largest homes",
    metaTitle: "Largest Homes for Sale",
    metaDescription:
      "The biggest homes on TrueDeed ranked by internal floor area, from real listing data.",
    intro:
      "Space to grow into. These are the largest homes currently for sale on TrueDeed, ranked by their stated internal floor area.",
    methodology:
      "Homes are ranked by stated internal floor area in square feet, largest first. Only homes with a recorded floor area appear — we never estimate a home's size.",
    badgeLabel: "Floor area",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "most-expensive-homes",
    kind: "expensive",
    title: "Most expensive homes",
    shortTitle: "Most expensive",
    metaTitle: "Most Expensive Homes",
    metaDescription:
      "The highest-priced homes for sale on TrueDeed, ranked by asking price.",
    intro:
      "The top of the market. These are the highest-priced homes currently listed for sale on TrueDeed, ranked purely by asking price.",
    methodology:
      "Homes are ranked by asking price, highest first. No other signal is applied — a home's position here reflects nothing but what the seller is asking for it.",
    badgeLabel: "Asking price",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "biggest-price-drops",
    kind: "price_drop",
    title: "Biggest price drops",
    shortTitle: "Price drops",
    metaTitle: "Biggest Price Drops",
    metaDescription:
      "Homes for sale with the largest asking-price reductions on TrueDeed, from real price history.",
    intro:
      "A price reduction can signal a seller ready to deal. These homes have had the largest asking-price cuts since they were first listed on TrueDeed.",
    methodology:
      "We rank homes by the percentage reduction between a previous asking price and the current one, using the listing's recorded price history. Only genuine reductions appear — a home with no price change never shows here.",
    badgeLabel: "Price drop",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: null,
  },
  {
    slug: "top-homes-in-london",
    kind: "city",
    title: "Top homes for sale in London",
    shortTitle: "Top homes in London",
    metaTitle: "Top Homes for Sale in London",
    metaDescription:
      "The standout homes for sale in London on TrueDeed, ranked by buyer interest, freshness, and listing quality.",
    intro:
      "London moves fast. These are the standout homes for sale in the capital right now, ranked by a blend of buyer engagement on TrueDeed, how recently they came to market, and how complete the listing is.",
    methodology:
      "London homes are scored from buyer engagement on TrueDeed (views, saves, and enquiries on a logarithmic scale, saves weighted double), a freshness factor that favours recently listed homes, and a data-quality factor that favours complete listings (price, photos, bedrooms, floor area). The three factors are multiplied together.",
    badgeLabel: "Top pick",
    minItemsToIndex: MIN_ITEMS_TO_INDEX,
    city: "london",
  },
] as const;

export function getTopListCategory(slug: string): TopListCategory | null {
  return TOP_LIST_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getAllTopListSlugs(): string[] {
  return TOP_LIST_CATEGORIES.map((c) => c.slug);
}

/** Other categories to cross-link from a list page (all except itself). */
export function getRelatedCategories(slug: string): TopListCategory[] {
  return TOP_LIST_CATEGORIES.filter((c) => c.slug !== slug);
}
