/**
 * Dashboard aggregation service with Redis caching.
 * Fetches role-specific dashboard data in 1-2 queries instead of 8-12,
 * caches results in Redis with 5-minute TTL.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/auth";
import type {
  ActivityLogEntry,
  AgentDashboard,
  DashboardData,
  HomebuyerDashboard,
  LandlordDashboard,
  ProviderDashboard,
  RenterDashboard,
  SellerDashboard,
} from "@/types/dashboard";
import { getCached, invalidateCache, setCache } from "@/lib/cache/redis";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_ACTIVITY_LIMIT = 20;

function cacheKey(userId: string): string {
  return `dashboard:${userId}`;
}

// ---------------------------------------------------------------------------
// Dashboard data aggregation
// ---------------------------------------------------------------------------

export type DashboardResult = Readonly<{
  data: DashboardData;
  cached: boolean;
}>;

/**
 * Get aggregated dashboard data for a user. Checks Redis cache first,
 * then builds role-specific data from database queries.
 */
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
): Promise<DashboardResult> {
  // Check cache first
  const cached = await getCached<DashboardData>(cacheKey(userId));
  if (cached) {
    return { data: cached, cached: true };
  }

  // Build role-specific dashboard data
  const data = await buildDashboardData(supabase, userId, role);

  // Cache result
  await setCache(cacheKey(userId), data, CACHE_TTL_SECONDS);

  return { data, cached: false };
}

/**
 * Invalidate a user's dashboard cache. Called when underlying data changes.
 */
export async function invalidateDashboardCache(
  userId: string,
): Promise<void> {
  await invalidateCache(cacheKey(userId));
}

// ---------------------------------------------------------------------------
// Role-specific data builders
// ---------------------------------------------------------------------------

async function buildDashboardData(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
): Promise<DashboardData> {
  switch (role) {
    case "homebuyer":
      return buildHomebuyerDashboard(supabase, userId);
    case "renter":
      return buildRenterDashboard(supabase, userId);
    case "seller":
      return buildSellerDashboard(supabase, userId);
    case "landlord":
      return buildLandlordDashboard(supabase, userId);
    case "agent":
      return buildAgentDashboard(supabase, userId);
    case "service_provider":
      return buildProviderDashboard(supabase, userId);
    default:
      return buildHomebuyerDashboard(supabase, userId);
  }
}

async function buildHomebuyerDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<HomebuyerDashboard> {
  const [savedCount, searchCount, viewings, activity] = await Promise.all([
    safeCount(supabase, "saved_properties", "user_id", userId),
    safeCount(supabase, "saved_searches", "user_id", userId),
    safeViewingsQuery(supabase, { user_id: userId, status: "confirmed" }, 5),
    getRecentActivity(supabase, userId, 5),
  ]);

  return {
    role: "homebuyer",
    saved_properties_count: savedCount,
    active_searches_count: searchCount,
    upcoming_viewings: viewings.map((v) => ({
      id: v.id,
      property_address: v.property_address,
      scheduled_at: new Date(v.scheduled_at),
      status: v.status as "confirmed" | "pending" | "cancelled",
    })),
    recent_activity: activity,
  };
}

async function buildRenterDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<RenterDashboard> {
  const [savedCount, applications, tenancy, activity] = await Promise.all([
    safeCount(supabase, "saved_properties", "user_id", userId),
    safeQuery<{ id: string; property_address: string; status: string; submitted_at: string }>(
      supabase,
      "rental_applications",
      "id, property_address, status, submitted_at",
      { user_id: userId },
      10,
    ),
    safeQuerySingle<{
      property_address: string;
      lease_start: string;
      lease_end: string;
      monthly_rent: number;
    }>(supabase, "tenancies", "property_address, lease_start, lease_end, monthly_rent", {
      tenant_id: userId,
      status: "active",
    }),
    getRecentActivity(supabase, userId, 5),
  ]);

  return {
    role: "renter",
    saved_rentals_count: savedCount,
    application_status: applications.map((a) => ({
      id: a.id,
      property_address: a.property_address,
      status: a.status as "submitted" | "under_review" | "approved" | "rejected",
      submitted_at: new Date(a.submitted_at),
    })),
    tenancy_details: tenancy
      ? {
          property_address: tenancy.property_address,
          lease_start: new Date(tenancy.lease_start),
          lease_end: new Date(tenancy.lease_end),
          monthly_rent: tenancy.monthly_rent,
        }
      : null,
    recent_activity: activity,
  };
}

async function buildSellerDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<SellerDashboard> {
  const [listings, viewingRequests, offers, activity] = await Promise.all([
    safeQuery<{
      id: string;
      address: string;
      price: number;
      views_count: number;
      saves_count: number;
      enquiries_count: number;
      status: string;
    }>(
      supabase,
      "listings",
      "id, address, price, views_count, saves_count, enquiries_count, status",
      { seller_id: userId },
      20,
    ),
    safeViewingsQuery(supabase, { seller_id: userId }, 10),
    safeQuery<{
      id: string;
      property_address: string;
      amount: number;
      status: string;
      submitted_at: string;
    }>(
      supabase,
      "offers",
      "id, property_address, amount, status, submitted_at",
      { seller_id: userId },
      10,
    ),
    getRecentActivity(supabase, userId, 5),
  ]);

  return {
    role: "seller",
    listings: listings.map((l) => ({
      id: l.id,
      address: l.address,
      price: l.price,
      views_count: l.views_count,
      saves_count: l.saves_count,
      enquiries_count: l.enquiries_count,
      status: l.status as "active" | "under_offer" | "sold" | "withdrawn",
    })),
    viewing_requests: viewingRequests.map((v) => ({
      id: v.id,
      property_address: v.property_address,
      scheduled_at: new Date(v.scheduled_at),
      status: v.status as "confirmed" | "pending" | "cancelled",
    })),
    offers: offers.map((o) => ({
      id: o.id,
      property_address: o.property_address,
      amount: o.amount,
      status: o.status as "pending" | "accepted" | "rejected" | "withdrawn",
      submitted_at: new Date(o.submitted_at),
    })),
    recent_activity: activity,
  };
}

async function buildLandlordDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<LandlordDashboard> {
  const [properties, activity] = await Promise.all([
    safeQuery<{
      id: string;
      address: string;
      status: string;
      monthly_rent: number;
      tenant_name: string | null;
      lease_end: string | null;
    }>(
      supabase,
      "landlord_properties",
      "id, address, status, monthly_rent, tenant_name, lease_end",
      { landlord_id: userId },
      50,
    ),
    getRecentActivity(supabase, userId, 5),
  ]);

  const portfolioCount = properties.length;
  const occupiedCount = properties.filter((p) => p.status === "occupied").length;
  const occupancyRate = portfolioCount > 0 ? occupiedCount / portfolioCount : 0;
  const totalIncome = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);

  return {
    role: "landlord",
    portfolio_count: portfolioCount,
    occupancy_rate: occupancyRate,
    total_income: totalIncome,
    properties: properties.map((p) => ({
      id: p.id,
      address: p.address,
      status: p.status as "occupied" | "vacant" | "maintenance",
      monthly_rent: p.monthly_rent,
      tenant_name: p.tenant_name,
      lease_end: p.lease_end ? new Date(p.lease_end) : null,
    })),
    recent_activity: activity,
  };
}

async function buildAgentDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<AgentDashboard> {
  const [listingsCount, leads, viewings, revenue, activity] = await Promise.all([
    safeCount(supabase, "listings", "agent_id", userId),
    safeQuery<{ stage: string }>(
      supabase,
      "leads",
      "stage",
      { agent_id: userId },
      500,
    ),
    safeViewingsQuery(supabase, { agent_id: userId }, 10),
    safeQuerySingle<{ current_month: number; previous_month: number; year_to_date: number }>(
      supabase,
      "agent_revenue_summary",
      "current_month, previous_month, year_to_date",
      { agent_id: userId },
    ),
    getRecentActivity(supabase, userId, 5),
  ]);

  const pipeline = {
    new: 0,
    contacted: 0,
    viewing_booked: 0,
    offer_made: 0,
    closed: 0,
  };
  for (const lead of leads) {
    const stage = lead.stage as keyof typeof pipeline;
    if (stage in pipeline) {
      pipeline[stage]++;
    }
  }

  return {
    role: "agent",
    active_listings_count: listingsCount,
    leads_pipeline: pipeline,
    viewings: viewings.map((v) => ({
      id: v.id,
      property_address: v.property_address,
      scheduled_at: new Date(v.scheduled_at),
      status: v.status as "confirmed" | "pending" | "cancelled",
    })),
    revenue: revenue ?? { current_month: 0, previous_month: 0, year_to_date: 0 },
    recent_activity: activity,
  };
}

async function buildProviderDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProviderDashboard> {
  const [profile, jobsCount, ratingStats, earningsResult, quotesCount, activity] =
    await Promise.all([
      safeQuerySingle<{ provider_details: { verification_status?: string } | null }>(
        supabase,
        "profiles",
        "provider_details",
        { id: userId },
      ),
      safeCount(supabase, "service_bookings", "provider_id", userId),
      safeQuerySingle<{ average_rating: number }>(
        supabase,
        "provider_rating_stats",
        "average_rating",
        { provider_id: userId },
      ),
      safeQuerySingle<{ total: number }>(
        supabase,
        "provider_earnings_summary",
        "total",
        { provider_id: userId },
      ),
      safeCount(supabase, "quotes", "provider_id", userId),
      getRecentActivity(supabase, userId, 5),
    ]);

  const verificationStatus =
    (profile?.provider_details?.verification_status as
      | "pending"
      | "verified"
      | "rejected") ?? "pending";

  return {
    role: "service_provider",
    verification_status: verificationStatus,
    active_jobs_count: jobsCount,
    average_rating: ratingStats?.average_rating ?? 0,
    total_earnings: earningsResult?.total ?? 0,
    pending_quotes_count: quotesCount,
    recent_activity: activity,
  };
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export type ActivityLogResult = Readonly<{
  entries: ReadonlyArray<ActivityLogEntry>;
  nextCursor: string | null;
}>;

/**
 * Get paginated activity log for a user with cursor-based pagination on created_at.
 */
export async function getActivityLog(
  supabase: SupabaseClient,
  userId: string,
  cursor?: string,
  limit: number = DEFAULT_ACTIVITY_LIMIT,
): Promise<ActivityLogResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("activity_log")
      .select("id, event_type, description, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine if there's a next page

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;

    if (error || !data) {
      return { entries: [], nextCursor: null };
    }

    const rows = data as Array<{
      id: number;
      event_type: string;
      description: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>;

    const hasMore = rows.length > limit;
    const entries = rows.slice(0, limit).map((row) => ({
      id: row.id,
      event_type: row.event_type,
      description: row.description,
      metadata: row.metadata,
      created_at: new Date(row.created_at),
    }));

    const nextCursor = hasMore
      ? entries[entries.length - 1].created_at.toISOString()
      : null;

    return { entries, nextCursor };
  } catch {
    return { entries: [], nextCursor: null };
  }
}

/**
 * Log a user activity event.
 */
export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      user_id: userId,
      event_type: eventType,
      description,
      metadata: metadata ?? {},
    });
  } catch {
    // Fire-and-forget: don't let activity logging break the caller
    console.error("[dashboard-service] Failed to log activity");
  }
}

// ---------------------------------------------------------------------------
// Safe query helpers (handle missing tables gracefully)
// ---------------------------------------------------------------------------

/**
 * Specialised query for viewings that JOINs viewing_slots → listings to
 * resolve the property address. The `viewings` table does not have a
 * `property_address` column; it is derived from the associated listing.
 *
 * Supabase foreign-key expand syntax:
 *   viewing_slots!inner( listings!inner(address) )
 */
async function safeViewingsQuery(
  supabase: SupabaseClient,
  filters: Record<string, string>,
  limit: number,
): Promise<Array<{ id: string; property_address: string; scheduled_at: string; status: string }>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("viewings")
      .select(
        "id, scheduled_at, status, viewing_slots!inner(listings!inner(address))",
      );

    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data) {
      console.error("[dashboard-service] safeViewingsQuery failed", {
        error,
        filters,
      });
      return [];
    }

    return (
      data as Array<{
        id: string;
        scheduled_at: string;
        status: string;
        viewing_slots: { listings: { address: string } };
      }>
    ).map((row) => ({
      id: row.id,
      scheduled_at: row.scheduled_at,
      status: row.status,
      property_address: row.viewing_slots.listings.address,
    }));
  } catch (err) {
    console.error("[dashboard-service] safeViewingsQuery threw", {
      error: err,
      filters,
    });
    return [];
  }
}

async function safeCount(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, value);

    if (error) {
      console.error("[dashboard-service] safeCount failed", {
        error,
        table,
        column,
        value,
      });
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("[dashboard-service] safeCount threw", {
      error: err,
      table,
      column,
      value,
    });
    return 0;
  }
}

async function safeQuery<T>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  filters: Record<string, string>,
  limit: number,
): Promise<T[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from(table).select(select);

    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data) {
      console.error("[dashboard-service] safeQuery failed", {
        error,
        table,
        filters,
      });
      return [];
    }
    return data as T[];
  } catch (err) {
    console.error("[dashboard-service] safeQuery threw", {
      error: err,
      table,
      filters,
    });
    return [];
  }
}

async function safeQuerySingle<T>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  filters: Record<string, string>,
): Promise<T | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from(table).select(select);

    for (const [key, val] of Object.entries(filters)) {
      query = query.eq(key, val);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      console.error("[dashboard-service] safeQuerySingle failed", {
        error,
        table,
        filters,
      });
      return null;
    }
    return data as T;
  } catch (err) {
    console.error("[dashboard-service] safeQuerySingle threw", {
      error: err,
      table,
      filters,
    });
    return null;
  }
}

async function getRecentActivity(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
): Promise<ActivityLogEntry[]> {
  const result = await getActivityLog(supabase, userId, undefined, limit);
  return [...result.entries];
}
