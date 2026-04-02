import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getSellerKPIs } from "@/services/seller/listing-service";
import { getListingAnalyticsSummary } from "@/services/seller/analytics-service";

export const dynamic = "force-dynamic";

const PerformanceChart = nextDynamic(
  () => import("@/components/seller/PerformanceChart").then((mod) => mod.PerformanceChart),
  { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-[--color-surface-container-low]" /> }
);

function PageSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <Skeleton className="lg:col-span-2 h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

async function PageContent() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

  const [kpis, listings, viewings] = await Promise.all([
    getSellerKPIs(supabase),
    supabase
      .from("seller_listings")
      .select("id")
      .eq("seller_id", user.id)
      .eq("status", "active"),
    supabase
      .from("seller_viewings")
      .select("id, buyer_name, viewing_datetime, viewing_type, listing_id")
      .eq("seller_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("viewing_datetime", new Date().toISOString())
      .order("viewing_datetime", { ascending: true })
      .limit(3),
  ]);

  // Enquiries — may not exist in all environments; safe fallback
  const enquiriesResult = await supabase
    .from("seller_enquiries")
    .select("id, buyer_name, message, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);
  const enquiries = enquiriesResult;

  let chartData: Array<{ date: string; count: number }> = [];
  if (listings.data && listings.data.length > 0) {
    const allSummaries = await Promise.all(
      listings.data.map((l: { id: string }) =>
        getListingAnalyticsSummary(supabase, l.id, 30)
      )
    );
    const merged: Record<string, number> = {};
    for (const summary of allSummaries) {
      for (const dv of summary.daily_views) {
        merged[dv.date] = (merged[dv.date] ?? 0) + dv.count;
      }
    }
    chartData = Object.entries(merged)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  const kpiCards = [
    {
      label: "Active Listings",
      value: kpis.active_listings,
      sub: "Premium Estate",
      subColor: "text-[--color-brand-secondary]",
      href: "/dashboard/seller/listings",
    },
    {
      label: "Total Views",
      value: kpis.total_views_30d.toLocaleString(),
      badge: kpis.views_change_pct !== undefined
        ? `${kpis.views_change_pct >= 0 ? "+" : ""}${kpis.views_change_pct}%`
        : null,
      sub: "Past 30 days",
      subColor: "text-[--color-outline]",
      href: "/dashboard/seller/analytics",
    },
    {
      label: "Enquiries",
      value: kpis.enquiries_30d,
      sub: "Past 30d",
      subColor: "text-[--color-outline]",
      href: "/dashboard/seller/enquiries",
    },
    {
      label: "Upcoming Viewings",
      value: kpis.upcoming_viewings,
      sub: "This week",
      subColor: "text-[--color-brand-secondary]",
      href: "/dashboard/seller/viewings",
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Page Header */}
      <header className="mb-2">
        <span className="text-xs font-bold tracking-[0.2em] text-[--color-brand-secondary-dark] uppercase block mb-2">
          Welcome Back
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-[--color-brand-primary] leading-tight font-heading">
          Property Performance Overview
        </h1>
      </header>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-[--color-surface-container-low] p-8 rounded-2xl flex flex-col justify-between min-h-40 hover:bg-[--color-surface-container] transition-colors duration-200 group"
          >
            <span className="text-xs font-bold tracking-[0.05em] uppercase text-[--color-on-surface-variant] block mb-4">
              {card.label}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl font-extrabold text-[--color-brand-primary] leading-none">
                {card.value}
              </span>
              {card.badge && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-[--color-brand-primary-lighter] rounded-full text-[--color-brand-primary]">
                  {card.badge}
                </span>
              )}
              {!card.badge && card.sub && (
                <span className={`text-sm font-medium ${card.subColor}`}>{card.sub}</span>
              )}
            </div>
          </Link>
        ))}
      </section>

      {/* Empty State */}
      {kpis.active_listings === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-12 text-center border border-outline-variant/20">
          <h2 className="text-xl font-bold text-[--color-brand-primary] font-heading mb-3">
            No listings yet
          </h2>
          <p className="text-[--color-on-surface-variant] text-sm mb-6 max-w-md mx-auto">
            Create your first listing to start tracking views, enquiries, and offers from buyers.
          </p>
          <Link
            href="/dashboard/seller/listings/create?step=1"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Create Your First Listing
          </Link>
        </div>
      )}

      {/* Analytics & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Views Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_50px_rgba(26,28,28,0.05)] border border-[--color-surface-container-high]/30">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[--color-brand-primary] font-heading">
              Views Trend
            </h2>
            <Link
              href="/dashboard/seller/analytics"
              className="text-xs font-bold text-[--color-brand-secondary-dark] uppercase tracking-wider hover:underline"
            >
              View Full Analytics
            </Link>
          </div>
          <PerformanceChart data={chartData} />
        </div>

        {/* Immediate Actions */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-[--color-brand-primary] font-heading mb-2">
            Immediate Actions
          </h2>
          <Link
            href="/dashboard/seller/listings"
            className="group flex items-center justify-between p-6 bg-[--color-surface-container-low] rounded-2xl hover:bg-brand-primary transition-all duration-300"
          >
            <div className="flex flex-col items-start">
              <span className="text-[--color-brand-primary] group-hover:text-white font-bold transition-colors font-heading">
                Manage Photos
              </span>
              <span className="text-[--color-on-surface-variant] group-hover:text-white/60 text-xs transition-colors mt-0.5">
                Update listing images
              </span>
            </div>
            <svg className="w-4 h-4 text-[--color-brand-primary] group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/dashboard/seller/viewings"
            className="group flex items-center justify-between p-6 bg-[--color-surface-container-low] rounded-2xl hover:bg-brand-primary transition-all duration-300"
          >
            <div className="flex flex-col items-start">
              <span className="text-[--color-brand-primary] group-hover:text-white font-bold transition-colors font-heading">
                Manage Viewings
              </span>
              <span className="text-[--color-on-surface-variant] group-hover:text-white/60 text-xs transition-colors mt-0.5">
                {kpis.upcoming_viewings} pending requests
              </span>
            </div>
            <svg className="w-4 h-4 text-[--color-brand-primary] group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/dashboard/seller/valuation"
            className="group flex items-center justify-between p-6 bg-[--color-surface-container-low] rounded-2xl hover:bg-secondary-container transition-all duration-300"
          >
            <div className="flex flex-col items-start">
              <span className="text-[--color-brand-primary] font-bold font-heading">
                Request Valuation
              </span>
              <span className="text-[--color-on-surface-variant] text-xs mt-0.5">
                Professional assessment
              </span>
            </div>
            <svg className="w-4 h-4 text-[--color-brand-primary] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Detailed Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
        {/* Recent Enquiries */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[--color-brand-primary] font-heading">
              Recent Enquiries
            </h2>
            <Link
              href="/dashboard/seller/enquiries"
              className="text-sm font-bold text-[--color-brand-secondary-dark] uppercase tracking-wider hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-6">
            {enquiries.data && enquiries.data.length > 0 ? (
              enquiries.data.map((enq: {
                id: string;
                buyer_name: string;
                message: string;
                created_at: string;
              }) => (
                <div
                  key={enq.id}
                  className="flex items-start gap-6 p-3 rounded-xl hover:bg-[--color-surface-container-low] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[--color-surface-container-high] flex-shrink-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-[--color-brand-primary]">
                      {enq.buyer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-bold text-[--color-brand-primary] font-heading">
                        {enq.buyer_name}
                      </h4>
                      <span className="text-[10px] font-bold text-[--color-outline] uppercase flex-shrink-0">
                        {new Date(enq.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[--color-on-surface-variant] line-clamp-2 italic">&ldquo;{enq.message}&rdquo;</p>
                    <div className="mt-3 flex gap-4">
                      <Link
                        href="/dashboard/seller/enquiries"
                        className="text-xs font-bold text-[--color-brand-primary] hover:underline"
                      >
                        Reply
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-[--color-outline] text-sm">
                No recent enquiries
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Viewings + Market Insight */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[--color-brand-primary] font-heading">
              Upcoming Viewings
            </h2>
            <Link
              href="/dashboard/seller/viewings"
              className="text-sm font-bold text-[--color-brand-secondary-dark] uppercase tracking-wider hover:underline"
            >
              Schedule
            </Link>
          </div>
          <div className="space-y-4">
            {viewings.data && viewings.data.length > 0 ? (
              viewings.data.map((v: {
                id: string;
                buyer_name: string;
                viewing_datetime: string;
                viewing_type: string;
              }, idx: number) => {
                const dt = new Date(v.viewing_datetime);
                const day = dt.toLocaleDateString("en-GB", { day: "numeric" });
                const month = dt.toLocaleDateString("en-GB", { month: "short" });
                const time = dt.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={v.id}
                    className={`bg-[--color-surface-container-low] p-6 rounded-2xl flex items-center gap-6 border-l-4 ${idx === 0 ? "border-[--color-brand-primary]" : "border-[--color-brand-secondary-dark]"}`}
                  >
                    <div className="text-center min-w-[50px]">
                      <span className="block text-xs font-bold text-[--color-outline] uppercase">
                        {month}
                      </span>
                      <span className="block text-2xl font-black text-[--color-brand-primary] font-heading">
                        {day}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[--color-brand-primary] font-heading truncate">
                        {v.buyer_name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-xs text-[--color-on-surface-variant]">{time}</span>
                        <span className="text-xs text-[--color-on-surface-variant] capitalize">
                          {v.viewing_type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/seller/viewings"
                      className="p-2 rounded-full hover:bg-surface-container-lowest transition-colors flex-shrink-0"
                      aria-label="Edit viewing"
                    >
                      <svg className="w-4 h-4 text-[--color-brand-primary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-[--color-outline] text-sm">
                No upcoming viewings scheduled
              </div>
            )}
          </div>

          {/* Market Insight Card */}
          <div className="mt-8 p-6 bg-brand-primary rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-1 font-heading">Market Insight</h4>
              <p className="text-xs text-[--color-brand-primary-lighter]/80 leading-relaxed max-w-[240px]">
                Track your listing performance against the local market. View your analytics for detailed comparisons.
              </p>
              <Link
                href="/dashboard/seller/analytics"
                className="mt-4 inline-block text-xs font-bold border-b border-white/40 pb-0.5 hover:border-white/70 transition-colors"
              >
                View Analytics
              </Link>
            </div>
            <svg className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10 rotate-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
            </svg>
          </div>
        </section>
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="space-y-10 max-w-6xl">
        <h1 className="text-4xl font-extrabold text-[--color-brand-primary] font-heading">Property Performance Overview</h1>
        <p className="text-sm text-[--color-on-surface-variant]">Unable to load dashboard data. Please try refreshing the page.</p>
      </div>
    );
  }
}

export default function SellerDashboardHome() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
