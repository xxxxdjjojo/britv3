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

export type MonthlyRevenue = Array<{ month: string; revenue: number }>;

export async function getMonthlyRevenue(
  supabase: SupabaseClient,
): Promise<MonthlyRevenue> {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const now = new Date();
  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const sevenMonthsAgoIso = sevenMonthsAgo.toISOString();

  // Build the last 7 month labels (oldest → newest)
  const monthSlots: MonthlyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSlots.push({ month: MONTH_NAMES[d.getMonth()], revenue: 0 });
  }

  const aggregateByMonth = (
    rows: Array<{ amount: number; created_at: string }>,
  ): void => {
    for (const row of rows) {
      const month = MONTH_NAMES[new Date(row.created_at).getMonth()];
      const slot = monthSlots.find((s) => s.month === month);
      if (slot) slot.revenue += row.amount ?? 0;
    }
  };

  try {
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount, created_at")
      .gte("created_at", sevenMonthsAgoIso)
      .order("created_at", { ascending: true })
      .limit(1000);

    if (!paymentsError && payments && payments.length > 0) {
      aggregateByMonth(payments as Array<{ amount: number; created_at: string }>);
      return monthSlots;
    }
  } catch {
    // table may not exist — fall through
  }

  try {
    const { data: invoices, error: invoicesError } = await supabase
      .from("provider_invoices")
      .select("total_amount, created_at")
      .gte("created_at", sevenMonthsAgoIso)
      .order("created_at", { ascending: true })
      .limit(1000);

    if (!invoicesError && invoices && invoices.length > 0) {
      aggregateByMonth(
        (invoices as Array<{ total_amount: number; created_at: string }>).map(
          (r) => ({ amount: r.total_amount, created_at: r.created_at }),
        ),
      );
      return monthSlots;
    }
  } catch {
    // table may not exist — fall through
  }

  // All sources empty or failed — return 7 months of zeros so the chart renders
  return monthSlots;
}

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
