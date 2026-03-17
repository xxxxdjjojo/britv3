import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnalyticsDegraded } from "@/components/admin/AnalyticsDegraded";
import { RevenueBarChart } from "@/components/admin/RevenueBarChart";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type StripeData = {
  mrr: number;
  subscriptionCount: number;
  planBreakdown: Array<{ planId: string; count: number; amount: number }>;
} | null;

type SupabaseRevenue = {
  platformCommission: number;
  totalTransactionVolume: number;
};

// ── Stripe fetching (cached 5 min) ────────────────────────────────────────────

const getStripeData = unstable_cache(
  async (): Promise<StripeData> => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return null;

      const res = await fetch(
        "https://api.stripe.com/v1/subscriptions?status=active&limit=100",
        {
          headers: { Authorization: `Bearer ${stripeKey}` },
        },
      );

      if (!res.ok) return null;

      const data = (await res.json()) as {
        data: Array<{
          plan: { id: string; amount: number; interval: string } | null;
          items?: { data: Array<{ price: { id: string; unit_amount: number } }> };
        }>;
      };

      const subs = data.data ?? [];
      const mrr =
        subs.reduce((sum, sub) => sum + (sub.plan?.amount ?? 0), 0) / 100;

      // Build plan breakdown
      const planMap: Record<string, { count: number; amount: number }> = {};
      for (const sub of subs) {
        const planId = sub.plan?.id ?? "unknown";
        const amount = (sub.plan?.amount ?? 0) / 100;
        if (!planMap[planId]) planMap[planId] = { count: 0, amount };
        planMap[planId].count++;
      }
      const planBreakdown = Object.entries(planMap).map(
        ([planId, { count, amount }]) => ({ planId, count, amount }),
      );

      return { mrr, subscriptionCount: subs.length, planBreakdown };
    } catch {
      return null;
    }
  },
  ["stripe-revenue-data"],
  { revalidate: 300 },
);

// ── Supabase commission data ───────────────────────────────────────────────────

async function getSupabaseRevenue(): Promise<SupabaseRevenue> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("amount");
    if (error || !data) return { platformCommission: 0, totalTransactionVolume: 0 };
    const total = (data as Array<{ amount: number }>).reduce(
      (sum, row) => sum + (row.amount ?? 0),
      0,
    );
    return {
      totalTransactionVolume: total,
      platformCommission: total * 0.025,
    };
  } catch {
    return { platformCommission: 0, totalTransactionVolume: 0 };
  }
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  subtitle,
}: Readonly<{ label: string; value: string; subtitle?: string }>) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
      <p
        className="text-2xl font-semibold text-neutral-900"
        style={{ fontFamily: "Plus Jakarta Sans" }}
      >
        {value}
      </p>
      {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Revenue content (async) ───────────────────────────────────────────────────

async function RevenueContent() {
  const [stripeData, supabaseRevenue] = await Promise.all([
    getStripeData(),
    getSupabaseRevenue(),
  ]);

  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stripeData ? (
          <>
            <KpiCard
              label="MRR (Monthly Recurring)"
              value={fmt(stripeData.mrr)}
              subtitle="From active Stripe subscriptions"
            />
            <KpiCard
              label="Active Subscriptions"
              value={stripeData.subscriptionCount.toLocaleString("en-GB")}
            />
          </>
        ) : (
          <>
            <div className="sm:col-span-2">
              <AnalyticsDegraded service="Stripe" message="Stripe is not configured. Set STRIPE_SECRET_KEY to enable subscription data." />
            </div>
          </>
        )}
        <KpiCard
          label="Transaction Volume"
          value={fmt(supabaseRevenue.totalTransactionVolume / 100)}
          subtitle="Total from payments table"
        />
        <KpiCard
          label="Platform Commission (2.5%)"
          value={fmt(supabaseRevenue.platformCommission / 100)}
          subtitle="Estimated platform earnings"
        />
      </div>

      {/* Subscription breakdown */}
      {stripeData && stripeData.planBreakdown.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2
            className="text-base font-semibold text-neutral-900 mb-4"
            style={{ fontFamily: "Plus Jakarta Sans" }}
          >
            Subscription Breakdown
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left pb-2 font-medium text-neutral-500">Plan ID</th>
                <th className="text-right pb-2 font-medium text-neutral-500">Subscribers</th>
                <th className="text-right pb-2 font-medium text-neutral-500">Price / mo</th>
              </tr>
            </thead>
            <tbody>
              {stripeData.planBreakdown.map(({ planId, count, amount }) => (
                <tr key={planId} className="border-b border-neutral-50 last:border-0">
                  <td className="py-2 font-mono text-xs text-neutral-700">{planId}</td>
                  <td className="py-2 text-right text-neutral-900">{count}</td>
                  <td className="py-2 text-right text-neutral-900">{fmt(amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Revenue Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2
          className="text-base font-semibold text-neutral-900 mb-1"
          style={{ fontFamily: "Plus Jakarta Sans" }}
        >
          Monthly Revenue
        </h2>
        <p className="text-xs text-neutral-400 mb-4">
          {stripeData ? "Live Stripe data" : "Placeholder data — connect Stripe to see live figures"}
        </p>
        <RevenueBarChart />
      </div>
    </div>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RevenueReportsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Revenue Reports"
        description="Subscription MRR, transaction volume, and platform commission."
      />
      <Suspense fallback={<RevenueSkeleton />}>
        <RevenueContent />
      </Suspense>
    </div>
  );
}
