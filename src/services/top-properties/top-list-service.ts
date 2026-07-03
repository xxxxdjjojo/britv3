/* eslint-disable no-console -- Server-side IO function; console.error matches project pattern (see area-detail-service.ts) */
/**
 * Top Properties list service — fetches eligible listings once, attaches the
 * HM Land Registry sold-price benchmark where the category needs it, and
 * ranks via the pure scoring lib.
 *
 * Direct queries by design: at the current listing volume a snapshot table
 * would be premature. Everything renders through ISR (1h) on the pages, and
 * this module is the single seam where snapshotting can slot in later.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getPostcodeCard } from "@/services/market-map/postcode-card-service";
import {
  LIST_PAGE_SIZE,
  TOP_LIST_CATEGORIES,
  getTopListCategory,
} from "@/lib/top-properties/top-list-config";
import { rankCandidates } from "@/lib/top-properties/top-list-scoring";
import type {
  TopListBenchmark,
  TopListCandidate,
  TopListCategory,
  TopListResult,
} from "@/lib/top-properties/types";

/** Hard cap on candidates fetched per refresh. */
const CANDIDATE_FETCH_LIMIT = 500;

type MediaRow = {
  url?: string | null;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  sort_order?: number | null;
  media_type?: string | null;
};

type PriceHistoryRow = {
  old_price?: number | null;
  new_price?: number | null;
  changed_at?: string | null;
};

type ListingRow = {
  id: string;
  slug: string | null;
  price: number | null;
  listing_type: string | null;
  status: string | null;
  deleted_at: string | null;
  listed_date: string | null;
  created_at: string | null;
  view_count: number | null;
  favorite_count: number | null;
  enquiry_count: number | null;
  properties: {
    title?: string | null;
    city?: string | null;
    postcode?: string | null;
    property_type?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    square_footage?: number | null;
  } | null;
  property_media: MediaRow[] | null;
  price_history: PriceHistoryRow[] | null;
};

const LISTING_SELECT = `
  id,
  slug,
  price,
  listing_type,
  status,
  deleted_at,
  listed_date,
  created_at,
  view_count,
  favorite_count,
  enquiry_count,
  properties (
    title,
    city,
    postcode,
    property_type,
    bedrooms,
    bathrooms,
    square_footage
  ),
  property_media (
    url,
    thumbnail_url,
    alt_text,
    sort_order,
    media_type
  ),
  price_history (
    old_price,
    new_price,
    changed_at
  )
`;

/**
 * Only URLs next/image can actually optimise: app-relative paths and the
 * Supabase storage hosts allowed in next.config. Anything else (e.g. seed
 * rows pointing at external placeholder services) falls back to the
 * no-photo state instead of crashing the page at render.
 */
function renderableImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol === "https:" && hostname.endsWith(".supabase.co")) return url;
  } catch {
    return null;
  }
  return null;
}

function pickImage(media: MediaRow[] | null): {
  imageUrl: string | null;
  imageAlt: string | null;
} {
  const photos = (media ?? [])
    .filter((m) => (m.media_type ?? "image") === "image")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  for (const photo of photos) {
    const url =
      renderableImageUrl(photo.thumbnail_url) ?? renderableImageUrl(photo.url);
    if (url) return { imageUrl: url, imageAlt: photo.alt_text ?? null };
  }
  return { imageUrl: null, imageAlt: null };
}

/** Largest genuine reduction in the listing's recorded price history. */
function pickPriceDrop(
  history: PriceHistoryRow[] | null,
): TopListCandidate["priceDrop"] {
  let best: TopListCandidate["priceDrop"] = null;
  for (const row of history ?? []) {
    const oldPrice = row.old_price ?? 0;
    const newPrice = row.new_price ?? 0;
    if (oldPrice <= 0 || newPrice <= 0 || newPrice >= oldPrice) continue;
    const pct = (oldPrice - newPrice) / oldPrice;
    const bestPct = best ? (best.oldPrice - best.newPrice) / best.oldPrice : 0;
    if (pct > bestPct) best = { oldPrice, newPrice };
  }
  return best;
}

function toCandidate(row: ListingRow): TopListCandidate | null {
  // Defensive re-check of the query filters — a private or deleted listing
  // must never be exposable even if the query changes.
  if (row.status !== "active" || row.deleted_at !== null) return null;
  if (!row.slug || row.price == null) return null;
  const property = row.properties;
  if (!property?.city || !property.postcode) return null;

  const { imageUrl, imageAlt } = pickImage(row.property_media);

  return {
    listingId: row.id,
    listingSlug: row.slug,
    title: property.title ?? "Property",
    price: row.price,
    listingType: row.listing_type === "rent" ? "rent" : "sale",
    city: property.city,
    postcode: property.postcode,
    propertyType: property.property_type ?? "",
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    squareFootage: property.square_footage ?? null,
    imageUrl,
    imageAlt,
    listedDate: row.listed_date ?? row.created_at ?? null,
    viewCount: row.view_count ?? 0,
    favoriteCount: row.favorite_count ?? 0,
    enquiryCount: row.enquiry_count ?? 0,
    priceDrop: pickPriceDrop(row.price_history),
    benchmark: null,
  };
}

async function fetchCandidates(): Promise<TopListCandidate[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .eq("listing_type", "sale")
    .limit(CANDIDATE_FETCH_LIMIT);

  if (error) {
    console.error(
      `[top-list-service] Failed to fetch listings: ${error.message}`,
    );
    return [];
  }

  return ((data ?? []) as unknown as ListingRow[])
    .map(toCandidate)
    .filter((c): c is TopListCandidate => c !== null);
}

/**
 * Attaches the sold-price benchmark to each candidate, deduping the postcode
 * lookups (many candidates share a postcode; each postcode is fetched once —
 * the underlying RPC is Redis-cached on top of that).
 */
async function attachBenchmarks(
  candidates: TopListCandidate[],
): Promise<TopListCandidate[]> {
  const postcodes = [...new Set(candidates.map((c) => c.postcode))];
  const cards = new Map(
    await Promise.all(
      postcodes.map(
        async (postcode) => [postcode, await getPostcodeCard(postcode)] as const,
      ),
    ),
  );

  return candidates.map((candidate) => {
    const card = cards.get(candidate.postcode);
    if (!card) return candidate;
    const band =
      candidate.propertyType.toLowerCase() === "flat" ? card.flat : card.house;
    if (!band || band.insufficient || band.median == null || band.median <= 0) {
      return candidate;
    }
    const benchmark: TopListBenchmark = {
      median: band.median,
      deltaPct: (candidate.price - band.median) / band.median,
      confidence: band.confidence,
      areaName: band.areaName,
    };
    return { ...candidate, benchmark };
  });
}

async function buildResult(
  category: TopListCategory,
  candidates: TopListCandidate[],
  now: Date,
): Promise<TopListResult> {
  const withSignals =
    category.kind === "value" ? await attachBenchmarks(candidates) : candidates;

  const ranked = rankCandidates(category, withSignals, {
    now,
    limit: LIST_PAGE_SIZE,
  });

  return {
    category,
    items: ranked,
    itemCount: ranked.length,
    isIndexable: ranked.length >= category.minItemsToIndex,
    generatedAt: now.toISOString(),
  };
}

/**
 * Ranks one configured list. Returns null for an unknown slug so the page
 * can 404 rather than render an empty shell for a URL that never existed.
 */
export async function getTopList(slug: string): Promise<TopListResult | null> {
  const category = getTopListCategory(slug);
  if (!category) return null;
  const candidates = await fetchCandidates();
  return buildResult(category, candidates, new Date());
}

/** Ranks every configured list from a single candidate fetch. */
export async function getAllTopLists(): Promise<Map<string, TopListResult>> {
  const candidates = await fetchCandidates();
  const now = new Date();
  const entries = await Promise.all(
    TOP_LIST_CATEGORIES.map(
      async (category) =>
        [category.slug, await buildResult(category, candidates, now)] as const,
    ),
  );
  return new Map(entries);
}

/** Slugs whose lists currently meet their indexability threshold (sitemap). */
export async function getIndexableTopListSlugs(): Promise<string[]> {
  const all = await getAllTopLists();
  return [...all.values()]
    .filter((result) => result.isIndexable)
    .map((result) => result.category.slug);
}
