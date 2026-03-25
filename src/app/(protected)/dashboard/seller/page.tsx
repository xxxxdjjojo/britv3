import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Home, Eye, MessageSquare, Calendar } from "lucide-react";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Seller Dashboard</h1>
        <p className="text-slate-500 mt-1">Track your listings and manage your sale</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          label="Active Listings"
          value={kpis.active_listings}
          icon={Home}
          iconBgClass="bg-emerald-100"
          iconColorClass="text-emerald-600"
        />
        <KpiCard
          label="Total Views"
          value={kpis.total_views_30d.toLocaleString()}
          changePct={kpis.views_change_pct}
          icon={Eye}
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-600"
        />
        <KpiCard
          label="Enquiries"
          value={kpis.enquiries_30d}
          changePct={kpis.enquiries_change_pct}
          icon={MessageSquare}
          iconBgClass="bg-orange-100"
          iconColorClass="text-orange-600"
        />
        <KpiCard
          label="Upcoming Viewings"
          value={kpis.upcoming_viewings}
          icon={Calendar}
          iconBgClass="bg-purple-100"
          iconColorClass="text-purple-600"
        />
      </div>
      {kpis.active_listings === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">No listings yet</h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Create your first listing to start tracking views, enquiries, and offers from buyers.
          </p>
          <a href="/dashboard/seller/listings/create?step=1"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] transition-colors shadow-lg shadow-[#1B4D3E]/20">
            Create Your First Listing
          </a>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">Performance (30 days)</h2>
            <p className="text-sm text-slate-400 mt-0.5">Daily views across all listings</p>
          </div>
        </div>
        <PerformanceChart data={chartData} />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4 font-['Plus_Jakarta_Sans']">Upcoming Viewings</h2>
        {viewings.data && viewings.data.length > 0 ? (
          <ul className="space-y-3">
            {viewings.data.map((v: any) => (
              <li key={v.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{v.buyer_name}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(v.viewing_datetime).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 capitalize">
                  {v.viewing_type.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">No upcoming viewings</p>
        )}
      </div>
    </div>
  );
}
