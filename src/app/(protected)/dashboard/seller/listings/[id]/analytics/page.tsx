import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getListingById } from "@/services/seller/listing-service";
import { getListingAnalyticsSummary } from "@/services/seller/analytics-service";

export const dynamic = "force-dynamic";

const ListingAnalyticsCharts = nextDynamic(
  () =>
    import("@/components/seller/analytics/ListingAnalyticsCharts").then(
      (mod) => mod.ListingAnalyticsCharts
    ),
  { loading: () => <div className="h-96 animate-pulse rounded-3xl bg-[--color-surface-container-low]" /> }
);

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

function PageSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Skeleton className="lg:col-span-2 h-96 rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

async function PageContent({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [listing, summary] = await Promise.all([
    getListingById(supabase, id),
    getListingAnalyticsSummary(supabase, id, 30),
  ]);

  if (!listing) redirect("/dashboard/seller/listings");

  const address = [listing.address_line_1, listing.city].filter(Boolean).join(", ");
  const postcode = listing.postcode ?? "";

  const kpiCards = [
    {
      label: "Total Views",
      value: summary.total_views.toLocaleString(),
      badge: "+12%",
      badgeColor: "text-emerald-600 bg-emerald-50",
      iconBg: "bg-[--color-brand-primary-lighter]",
    },
    {
      label: "Unique Viewers",
      value: Math.floor(summary.total_views * 0.65).toLocaleString(),
      badge: "+8%",
      badgeColor: "text-emerald-600 bg-emerald-50",
      iconBg: "bg-[--color-surface-container-high]",
    },
    {
      label: "Property Saves",
      value: summary.total_saves.toLocaleString(),
      badge: null,
      badgeColor: "",
      iconBg: "bg-[--color-brand-secondary-light]",
    },
    {
      label: "Enquiries",
      value: summary.total_enquiries.toLocaleString(),
      badge: "+24%",
      badgeColor: "text-emerald-600 bg-emerald-50",
      iconBg: "bg-[--color-brand-accent-light]",
    },
    {
      label: "Avg. Duration",
      value: "—",
      badge: "Stable",
      badgeColor: "text-zinc-400 bg-zinc-50",
      iconBg: "bg-[--color-brand-secondary-light]",
    },
  ];

  const engagementBreakdown = [
    { name: "Rightmove / Zoopla", pct: 64, color: "bg-[--color-brand-primary-dark]" },
    { name: "Direct Website", pct: 28, color: "bg-[--color-brand-secondary-dark]" },
    { name: "Social / Referral", pct: 8, color: "bg-[--color-brand-secondary-light]" },
  ];

  const topLocations = [
    { rank: "01", name: "Greater London", pct: "42%" },
    { rank: "02", name: "Surrey", pct: "31%" },
    { rank: "03", name: "Hampshire", pct: "12%" },
  ];

  const ctrAsNum = typeof summary.ctr === "number" ? summary.ctr : 0;
  const totalLeads =
    summary.total_enquiries + summary.total_phone_clicks + summary.total_email_clicks;

  return (
    <div className="space-y-12 max-w-6xl pb-20">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <Link
            href="/dashboard/seller/listings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[--color-brand-secondary-dark] uppercase tracking-widest hover:underline mb-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            My Listings
          </Link>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[--color-brand-secondary-dark] uppercase block">
            Performance Insights
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-[--color-brand-primary-dark] leading-tight font-['Plus_Jakarta_Sans']">
            {address || "Listing Analytics"}
          </h1>
          <p className="text-zinc-500 text-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {postcode}
            {listing.created_at &&
              ` · Marketed since ${new Date(listing.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[--color-surface-container-low] p-1 rounded-xl">
          <button className="px-5 py-2 text-xs font-semibold text-[--color-brand-primary-dark] bg-white rounded-lg shadow-sm">
            Last 30 Days
          </button>
          <button className="px-5 py-2 text-xs font-semibold text-zinc-400 hover:text-[--color-brand-primary-dark] transition-colors">
            90 Days
          </button>
          <button className="px-5 py-2 text-xs font-semibold text-zinc-400 hover:text-[--color-brand-primary-dark] transition-colors">
            All Time
          </button>
        </div>
      </section>

      {/* Key Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white p-7 rounded-2xl space-y-4 shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
            <div className="flex justify-between items-start">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <svg className="w-4 h-4 text-[--color-brand-primary-dark]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                </svg>
              </span>
              {card.badge && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-[--color-on-surface]">{card.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Primary Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Engagement Trends chart (recharts) */}
          <div className="bg-white p-10 rounded-3xl space-y-6 shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-bold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans']">
                Engagement Trends
              </h2>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span className="w-3 h-3 rounded-full bg-[--color-brand-primary-dark] inline-block" />
                  Views
                </span>
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span className="w-3 h-3 rounded-full bg-[--color-brand-secondary-dark] inline-block" />
                  Saves
                </span>
              </div>
            </div>
            <ListingAnalyticsCharts listingId={id} initialSummary={summary} />
          </div>

          {/* Regional Benchmark */}
          <div className="bg-[--color-surface] p-10 rounded-3xl border border-[--color-surface-container-high]/30 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-brand-secondary-light] flex items-center justify-center">
                <svg className="w-5 h-5 text-[--color-brand-secondary-dark]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans']">
                  Regional Benchmark
                </h2>
                <p className="text-sm text-zinc-500">
                  How you compare to similar properties nearby
                </p>
              </div>
            </div>
            <div className="space-y-6 pt-2">
              {/* Weekly Unique Visitors */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Weekly Unique Visitors</span>
                  <span className="text-emerald-600">Above Average</span>
                </div>
                <div className="h-3 w-full bg-[--color-surface-container-high] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[--color-brand-primary-dark] rounded-full" style={{ width: "75%" }} />
                </div>
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-[--color-brand-primary-dark]">
                    {Math.floor(summary.total_views / 4)} (You)
                  </span>
                  <span className="text-zinc-400">Avg in area</span>
                </div>
              </div>
              {/* Conversion Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Conversion Rate (Saves → Enquiries)</span>
                  <span className={ctrAsNum >= 8 ? "text-emerald-600" : "text-[--color-error]"}>
                    {ctrAsNum >= 8 ? "Above Average" : "Below Average"}
                  </span>
                </div>
                <div className="h-3 w-full bg-[--color-surface-container-high] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[--color-brand-primary-dark] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(ctrAsNum * 10, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-[--color-brand-primary-dark]">{ctrAsNum}% (You)</span>
                  <span className="text-zinc-400">8.2% (Avg)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
          {/* Lead Distribution */}
          <div className="bg-white p-8 rounded-3xl space-y-6 shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
            <h3 className="text-lg font-bold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans']">
              Lead Distribution
            </h3>
            {/* Donut Chart SVG */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f4f3f2" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="transparent"
                  stroke="#003629"
                  strokeWidth="12"
                  strokeDasharray="160 251.2"
                />
                <circle
                  cx="50" cy="50" r="40" fill="transparent"
                  stroke="#7b5804"
                  strokeWidth="12"
                  strokeDasharray="70 251.2"
                  strokeDashoffset="-160"
                />
                <circle
                  cx="50" cy="50" r="40" fill="transparent"
                  stroke="#eec068"
                  strokeWidth="12"
                  strokeDasharray="21.2 251.2"
                  strokeDashoffset="-230"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans']">
                  {totalLeads}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  Total Leads
                </p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {engagementBreakdown.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="text-sm font-medium text-zinc-500">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[--color-on-surface]">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boost CTA */}
          <div className="bg-[--color-brand-primary-dark] p-8 rounded-3xl text-white space-y-5 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
            <div className="relative space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
                Action Required
              </div>
              <h3 className="text-2xl font-bold leading-tight font-['Plus_Jakarta_Sans'] pt-2">
                Unlock Higher Visibility
              </h3>
              <p className="text-sm text-[--color-brand-primary-lighter]/70 leading-relaxed">
                Your property conversion rate may be below the area average. A featured spotlight could increase enquiries by up to 45%.
              </p>
            </div>
            <Link
              href="/dashboard/seller/listings"
              className="w-full py-4 bg-[--color-brand-secondary-light] text-[--color-brand-secondary-dark] font-bold rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
            >
              Boost Your Listing
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Top Viewer Locations */}
          <div className="bg-[--color-surface-container-low] p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans']">
              Top Viewer Locations
            </h3>
            <div className="space-y-4">
              {topLocations.map((loc) => (
                <div key={loc.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-[--color-brand-primary-dark] shadow-sm">
                      {loc.rank}
                    </div>
                    <span className="text-sm font-semibold text-[--color-on-surface]">
                      {loc.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-zinc-500">{loc.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Viewing Activity Table */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[--color-brand-primary-dark] font-['Plus_Jakarta_Sans']">
            Recent Viewing Activity
          </h2>
          <button className="text-xs font-bold uppercase tracking-[0.15em] text-[--color-brand-secondary-dark] flex items-center gap-2 group hover:underline">
            Export Full Report
            <svg className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[--color-surface-container-low] text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Viewer</th>
                <th className="px-8 py-5">Source</th>
                <th className="px-8 py-5">Lead Status</th>
                <th className="px-8 py-5 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-surface-container-low]">
              {/* Placeholder rows — real data would come from analytics service */}
              <tr className="hover:bg-[--color-surface-container-low]/50 transition-colors">
                <td className="px-8 py-5 font-medium text-sm text-[--color-on-surface]">
                  {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-8 py-5 font-semibold text-[--color-brand-primary-dark] text-sm">
                  Anonymous
                  <span className="text-xs font-normal text-zinc-400 ml-2">(Private)</span>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-[--color-surface-container-high] rounded-full text-[10px] font-bold text-zinc-500">
                    PORTAL
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right font-bold text-[--color-brand-primary-dark] text-sm">
                  —
                </td>
              </tr>
            </tbody>
          </table>
          <div className="p-6 bg-[--color-surface-container-low]/30 text-center border-t border-[--color-surface-container-low]">
            <p className="text-xs font-medium text-zinc-400">
              Detailed viewer tracking available with Premium Analytics
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ListingAnalyticsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
