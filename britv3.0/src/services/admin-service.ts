import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminCounts = {
  totalUsers: number;
  activeListings: number;
  pendingVerifications: number;
  openReports: number;
  totalReviews: number;
};

async function safeCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: PromiseLike<{ count: number | null; error: any }>,
): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminCounts(
  supabase: SupabaseClient,
): Promise<AdminCounts> {
  const [
    totalUsers,
    activeListings,
    pendingVerifications,
    openReports,
    totalReviews,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
    ),
    safeCount(
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ),
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending"),
    ),
    safeCount(
      supabase
        .from("content_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ),
    safeCount(
      supabase
        .from("provider_reviews")
        .select("id", { count: "exact", head: true }),
    ),
  ]);

  return {
    totalUsers,
    activeListings,
    pendingVerifications,
    openReports,
    totalReviews,
  };
}
