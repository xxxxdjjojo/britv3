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

  const { data, error } = await query;
  if (error) throw error;

  const withStats = await Promise.all(
    (data ?? []).map(async (listing) => {
      const [viewsRes, savesRes, enquiriesRes] = await Promise.all([
        supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id).eq("event_type", "view"),
        supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id).eq("event_type", "save"),
        supabase.from("listing_analytics_events").select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id).eq("event_type", "enquiry"),
      ]);

      const days: number[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStr = day.toISOString().split("T")[0];
        const { count } = await supabase
          .from("listing_analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id)
          .eq("event_type", "view")
          .gte("occurred_at", `${dayStr}T00:00:00Z`)
          .lt("occurred_at", `${dayStr}T23:59:59Z`);
        days.push(count ?? 0);
      }

      return {
        ...listing,
        views_count: viewsRes.count ?? 0,
        saves_count: savesRes.count ?? 0,
        enquiries_count: enquiriesRes.count ?? 0,
        weekly_views: days,
      } as ListingWithStats;
    }),
  );
  return withStats;
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
