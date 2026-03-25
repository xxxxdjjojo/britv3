/**
 * listing-service.ts — Seller listing CRUD and KPI aggregation
 * Uses Supabase server client (passed as argument for testability)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SellerListing,
  ListingWithStats,
  ListingStatus,
  SellerDashboardKPIs,
} from "@/types/seller";

/** Fetch all listings for the authenticated seller with view/save/enquiry counts */
export async function getSellerListings(
  supabase: SupabaseClient,
  status?: ListingStatus,
): Promise<ListingWithStats[]> {
  let query = supabase
    .from("seller_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: listings, error } = await query;
  if (error) throw error;
  if (!listings || listings.length === 0) return [];

  const listingIds = listings.map((l) => l.id);

  // Single batch query for all analytics counts
  const { data: eventCounts } = await supabase
    .from("listing_analytics_events")
    .select("listing_id, event_type")
    .in("listing_id", listingIds);

  // Aggregate counts per listing
  const countsMap: Record<string, { views: number; saves: number; enquiries: number }> = {};
  for (const evt of eventCounts ?? []) {
    const key = evt.listing_id;
    if (!countsMap[key]) countsMap[key] = { views: 0, saves: 0, enquiries: 0 };
    if (evt.event_type === "view") countsMap[key].views++;
    else if (evt.event_type === "save") countsMap[key].saves++;
    else if (evt.event_type === "enquiry") countsMap[key].enquiries++;
  }

  // 7-day view counts (single query for all listings)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const { data: recentViews } = await supabase
    .from("listing_analytics_events")
    .select("listing_id, occurred_at")
    .in("listing_id", listingIds)
    .eq("event_type", "view")
    .gte("occurred_at", sevenDaysAgo.toISOString());

  const weeklyMap: Record<string, number[]> = {};
  for (const id of listingIds) {
    weeklyMap[id] = [0, 0, 0, 0, 0, 0, 0];
  }
  const now = new Date();
  for (const evt of recentViews ?? []) {
    const evtDate = new Date(evt.occurred_at);
    const dayIndex = 6 - Math.floor((now.getTime() - evtDate.getTime()) / 86400000);
    if (dayIndex >= 0 && dayIndex < 7) {
      weeklyMap[evt.listing_id][dayIndex]++;
    }
  }

  return listings.map((listing) => ({
    ...listing,
    views_count: countsMap[listing.id]?.views ?? 0,
    saves_count: countsMap[listing.id]?.saves ?? 0,
    enquiries_count: countsMap[listing.id]?.enquiries ?? 0,
    weekly_views: weeklyMap[listing.id] ?? [0, 0, 0, 0, 0, 0, 0],
  })) as ListingWithStats[];
}

/** Fetch a single listing by ID (seller must own it — RLS enforces) */
export async function getListingById(
  supabase: SupabaseClient,
  listingId: string,
): Promise<SellerListing | null> {
  const { data, error } = await supabase
    .from("seller_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Create a new listing draft (step 1 data only — subsequent steps call updateListing) */
export async function createListing(
  supabase: SupabaseClient,
  input: Readonly<{
    postcode: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    property_type: string;
    tenure: string;
    leasehold_years_remaining?: number;
  }>,
): Promise<SellerListing> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  // Check for existing active listing at same address
  const { data: existing } = await supabase
    .from("seller_listings")
    .select("id")
    .eq("seller_id", user.id)
    .eq("postcode", input.postcode.toUpperCase())
    .eq("address_line_1", input.address_line_1)
    .in("status", ["draft", "active", "under_offer"])
    .maybeSingle();

  if (existing) {
    throw new Error("You already have an active listing at this address");
  }

  const { data, error } = await supabase
    .from("seller_listings")
    .insert({ ...input, seller_id: user.id, status: "draft" })
    .select()
    .single();
  if (error) throw error;
  return data as SellerListing;
}

/** Partial update — used by each wizard step to save progress */
export async function updateListing(
  supabase: SupabaseClient,
  listingId: string,
  patch: Partial<Omit<SellerListing, "id" | "seller_id" | "created_at" | "updated_at">>,
): Promise<SellerListing> {
  const { data, error } = await supabase
    .from("seller_listings")
    .update(patch)
    .eq("id", listingId)
    .select()
    .single();
  if (error) throw error;
  return data as SellerListing;
}

/** Publish a draft listing — sets status=active and published_at=now() */
export async function publishListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<SellerListing> {
  return updateListing(supabase, listingId, {
    status: "active",
    published_at: new Date().toISOString(),
  });
}

/** Archive a listing */
export async function archiveListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<void> {
  const { error } = await supabase
    .from("seller_listings")
    .update({ status: "archived" })
    .eq("id", listingId);
  if (error) throw error;
}

/** Aggregate KPIs for dashboard home */
export async function getSellerKPIs(
  supabase: SupabaseClient,
): Promise<SellerDashboardKPIs> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Fetch listing IDs first to use in analytics subqueries (TypeScript-safe)
  const { data: listingRows } = await supabase
    .from("seller_listings")
    .select("id")
    .eq("seller_id", user.id);
  const listingIds: string[] = (listingRows ?? []).map((r: { id: string }) => r.id);

  const [listingsRes, viewsRes, viewsPriorRes, enquiriesRes, enquiriesPriorRes, viewingsRes] =
    await Promise.all([
      supabase.from("seller_listings").select("*", { count: "exact", head: true })
        .eq("seller_id", user.id).eq("status", "active"),
      listingIds.length === 0
        ? Promise.resolve({ count: 0 })
        : supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .in("listing_id", listingIds)
          .eq("event_type", "view").gte("occurred_at", thirtyDaysAgo.toISOString()),
      listingIds.length === 0
        ? Promise.resolve({ count: 0 })
        : supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .in("listing_id", listingIds)
          .eq("event_type", "view")
          .gte("occurred_at", sixtyDaysAgo.toISOString())
          .lt("occurred_at", thirtyDaysAgo.toISOString()),
      listingIds.length === 0
        ? Promise.resolve({ count: 0 })
        : supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .in("listing_id", listingIds)
          .eq("event_type", "enquiry").gte("occurred_at", thirtyDaysAgo.toISOString()),
      listingIds.length === 0
        ? Promise.resolve({ count: 0 })
        : supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .in("listing_id", listingIds)
          .eq("event_type", "enquiry")
          .gte("occurred_at", sixtyDaysAgo.toISOString())
          .lt("occurred_at", thirtyDaysAgo.toISOString()),
      supabase.from("seller_viewings").select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .in("status", ["pending", "confirmed"])
        .gte("viewing_datetime", now.toISOString()),
    ]);

  const pctChange = (current: number, prior: number) =>
    prior === 0 ? 0 : Math.round(((current - prior) / prior) * 100);

  const views = viewsRes.count ?? 0;
  const viewsPrior = viewsPriorRes.count ?? 0;
  const enquiries = enquiriesRes.count ?? 0;
  const enquiriesPrior = enquiriesPriorRes.count ?? 0;

  return {
    active_listings: listingsRes.count ?? 0,
    total_views_30d: views,
    views_change_pct: pctChange(views, viewsPrior),
    enquiries_30d: enquiries,
    enquiries_change_pct: pctChange(enquiries, enquiriesPrior),
    upcoming_viewings: viewingsRes.count ?? 0,
    viewings_change_pct: 0,
  };
}
