import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

export type PlatformMetrics = {
  totalUsers: number;
  activeListings: number;
  pendingVerifications: number;
  openReports: number;
  totalReviews: number;
};

export async function getPlatformMetrics(
  supabase: SupabaseClient,
): Promise<PlatformMetrics> {
  // Use Promise.all for parallel fetching — max ~50ms
  const safeCount = async (query: PromiseLike<{ count: number | null; error: PostgrestError | null }>): Promise<number> => {
    try {
      const { count, error } = await query;
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  const [
    totalUsers,
    activeListings,
    pendingVerifications,
    openReports,
    totalReviews,
  ] = await Promise.all([
    safeCount(
      supabase.from("profiles").select("id", { count: "exact", head: true }),
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

// Stripe revenue data — cached 5 minutes
export const getRevenueData = unstable_cache(
  async (): Promise<Record<string, unknown> | null> => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return null;

      // Fetch MRR from Stripe subscriptions
      const res = await fetch(
        "https://api.stripe.com/v1/subscriptions?status=active&limit=100",
        {
          headers: { Authorization: `Bearer ${stripeKey}` },
        },
      );

      if (!res.ok) return null;
      const data = (await res.json()) as {
        data: Array<{ plan: { amount: number } }>;
      };

      const mrr =
        (data.data ?? []).reduce(
          (sum: number, sub) => sum + (sub.plan?.amount ?? 0),
          0,
        ) / 100;
      return { mrr, subscriptionCount: data.data?.length ?? 0 };
    } catch {
      return null; // Degraded — page renders skeleton
    }
  },
  ["revenue-data"],
  { revalidate: 300 }, // 5 minutes
);

// PostHog behaviour data — cached 5 minutes
export const getBehaviourData = unstable_cache(
  async (): Promise<Record<string, unknown> | null> => {
    try {
      const phKey = process.env.POSTHOG_API_KEY;
      const phProject = process.env.POSTHOG_PROJECT_ID;
      if (!phKey || !phProject) return null;

      const res = await fetch(
        `https://app.posthog.com/api/projects/${phProject}/insights/trend/`,
        {
          headers: { Authorization: `Bearer ${phKey}` },
        },
      );

      if (!res.ok) return null;
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return null; // Degraded — page renders skeleton
    }
  },
  ["behaviour-data"],
  { revalidate: 300 },
);
