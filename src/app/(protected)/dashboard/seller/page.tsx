import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Eye, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/seller/KpiCard";
import { PerformanceChart } from "@/components/seller/PerformanceChart";
import { getSellerKPIs } from "@/services/seller/listing-service";
import { getListingAnalyticsSummary } from "@/services/seller/analytics-service";

export const dynamic = "force-dynamic";

export default async function SellerDashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [kpis, listings, viewings] = await Promise.all([
    getSellerKPIs(supabase),
    supabase.from("seller_listings").select("id").eq("seller_id", user.id).eq("status", "active"),
    supabase
      .from("seller_viewings")
      .select("id, buyer_name, viewing_datetime, viewing_type, listing_id")
      .eq("seller_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("viewing_datetime", new Date().toISOString())
      .order("viewing_datetime", { ascending: true })
      .limit(5),
  ]);

  let chartData: Array<{ date: string; count: number }> = [];
  if (listings.data && listings.data.length > 0) {
    const allSummaries = await Promise.all(
      listings.data.map((l: { id: string }) => getListingAnalyticsSummary(supabase, l.id, 30)),
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

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-neutral-900] font-['Plus_Jakarta_Sans'] tracking-tight">
          Seller Dashboard
        </h1>
        <p className="text-[--color-neutral-500] mt-1 text-sm font-inter">
          Track your listings and manage your sale
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/dashboard/seller/listings" className="block">
          <KpiCard
            label="Active Listings"
            value={kpis.active_listings}
            icon={Home}
            iconBgClass="bg-[--color-brand-primary-lighter]"
            iconColorClass="text-[--color-brand-primary]"
          />
        </Link>
        <Link href="/dashboard/seller/analytics" className="block">
          <KpiCard
            label="Total Views"
            value={kpis.total_views_30d.toLocaleString()}
            changePct={kpis.views_change_pct}
            icon={Eye}
            iconBgClass="bg-[--color-info-light]"
            iconColorClass="text-[--color-info]"
          />
        </Link>
        <Link href="/dashboard/seller/analytics" className="block">
          <KpiCard
            label="Enquiries"
            value={kpis.enquiries_30d}
            changePct={kpis.enquiries_change_pct}
            icon={MessageSquare}
            iconBgClass="bg-[--color-warning-light]"
            iconColorClass="text-[--color-warning]"
          />
        </Link>
        <Link href="/dashboard/seller/viewings" className="block">
          <KpiCard
            label="Upcoming Viewings"
            value={kpis.upcoming_viewings}
            icon={Calendar}
            iconBgClass="bg-purple-50"
            iconColorClass="text-purple-600"
          />
        </Link>
      </div>

      {/* Empty State */}
      {kpis.active_listings === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-[--color-brand-primary-lighter] flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-[--color-brand-primary]" strokeWidth={1.25} />
          </div>
          <h2 className="text-xl font-bold text-[--color-neutral-900] font-['Plus_Jakarta_Sans']">
            No listings yet
          </h2>
          <p className="text-[--color-neutral-500] mt-2 max-w-md mx-auto text-sm font-inter">
            Create your first listing to start tracking views, enquiries, and offers from buyers.
          </p>
          <a
            href="/dashboard/seller/listings/create?step=1"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[--color-brand-primary] text-white text-sm font-semibold hover:bg-[--color-brand-primary-light] transition-colors shadow-lg shadow-black/10 font-inter"
          >
            Create Your First Listing
          </a>
        </div>
      )}

      {/* Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-[--color-neutral-900] font-['Plus_Jakarta_Sans']">
              Performance
            </h2>
            <p className="text-sm text-[--color-neutral-400] mt-0.5 font-inter">
              Daily views across all listings — last 30 days
            </p>
          </div>
          <Link
            href="/dashboard/seller/analytics"
            className="flex items-center gap-1.5 text-xs font-medium text-[--color-brand-primary] hover:underline font-inter"
          >
            View full analytics <ArrowRight size={12} strokeWidth={1.25} />
          </Link>
        </div>
        <PerformanceChart data={chartData} />
      </div>

      {/* Upcoming Viewings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[--color-neutral-900] font-['Plus_Jakarta_Sans']">
            Upcoming Viewings
          </h2>
          <Link
            href="/dashboard/seller/viewings"
            className="flex items-center gap-1.5 text-xs font-medium text-[--color-brand-primary] hover:underline font-inter"
          >
            View all <ArrowRight size={12} strokeWidth={1.25} />
          </Link>
        </div>
        {viewings.data && viewings.data.length > 0 ? (
          <ul className="divide-y divide-[--color-neutral-100]">
            {viewings.data.map((v: {
              id: string;
              buyer_name: string;
              viewing_datetime: string;
              viewing_type: string;
            }) => (
              <li key={v.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-[--color-neutral-900] font-inter">
                    {v.buyer_name}
                  </p>
                  <p className="text-xs text-[--color-neutral-400] mt-0.5 font-inter">
                    {new Date(v.viewing_datetime).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[--color-info-light] text-[--color-info] capitalize font-inter">
                  {v.viewing_type.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-[--color-neutral-400] font-inter">No upcoming viewings scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}
