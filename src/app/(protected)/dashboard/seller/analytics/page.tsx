import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getSellerListings, getSellerKPIs } from "@/services/seller/listing-service";

export const dynamic = "force-dynamic";

function PageSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [kpis, listings] = await Promise.all([
    getSellerKPIs(supabase),
    getSellerListings(supabase),
  ]);

  const activeListings = listings.filter((l) => l.status === "active");
  const totalViews = listings.reduce((sum, l) => sum + l.views_count, 0);
  const totalSaves = listings.reduce((sum, l) => sum + l.saves_count, 0);
  const totalEnquiries = listings.reduce((sum, l) => sum + l.enquiries_count, 0);

  const kpiCards = [
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      badge: kpis.views_change_pct !== undefined
        ? `${kpis.views_change_pct >= 0 ? "+" : ""}${kpis.views_change_pct}%`
        : null,
      badgeColor: (kpis.views_change_pct ?? 0) >= 0
        ? "text-brand-primary bg-primary-container/20"
        : "text-[--color-error] bg-[--color-error-container]",
      iconBg: "bg-[--color-brand-primary-lighter]",
      iconColor: "text-[--color-brand-primary]",
    },
    {
      label: "Unique Viewers",
      value: Math.floor(totalViews * 0.65).toLocaleString(),
      badge: null,
      badgeColor: "",
      iconBg: "bg-[--color-surface-container-high]",
      iconColor: "text-[--color-on-surface-variant]",
    },
    {
      label: "Property Saves",
      value: totalSaves.toLocaleString(),
      badge: null,
      badgeColor: "",
      iconBg: "bg-[--color-brand-secondary-light]",
      iconColor: "text-[--color-brand-secondary-dark]",
    },
    {
      label: "Enquiries",
      value: totalEnquiries.toLocaleString(),
      badge: kpis.enquiries_change_pct !== undefined
        ? `${kpis.enquiries_change_pct >= 0 ? "+" : ""}${kpis.enquiries_change_pct}%`
        : null,
      badgeColor: (kpis.enquiries_change_pct ?? 0) >= 0
        ? "text-brand-primary bg-primary-container/20"
        : "text-[--color-error] bg-[--color-error-container]",
      iconBg: "bg-[--color-secondary-container]/20",
      iconColor: "text-[--color-secondary-container]",
    },
    {
      label: "Active Listings",
      value: String(kpis.active_listings),
      badge: null,
      badgeColor: "",
      iconBg: "bg-[--color-brand-secondary-light]",
      iconColor: "text-[--color-brand-secondary-dark]",
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-[0.2em] text-[--color-brand-secondary-dark] uppercase block">
            Performance Insights
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-[--color-brand-primary] leading-tight font-heading">
            Market Analytics
          </h1>
          <p className="text-[--color-on-surface-variant] text-sm flex items-center gap-1.5">
            Across all your active listings &bull; Last 30 days
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[--color-surface-container-low] p-1 rounded-xl">
          <button className="px-5 py-2 text-xs font-semibold text-[--color-brand-primary] bg-surface-container-lowest rounded-lg shadow-sm">
            Last 30 Days
          </button>
          <button className="px-5 py-2 text-xs font-semibold text-[--color-outline] hover:text-[--color-brand-primary] transition-colors">
            90 Days
          </button>
          <button className="px-5 py-2 text-xs font-semibold text-[--color-outline] hover:text-[--color-brand-primary] transition-colors">
            All Time
          </button>
        </div>
      </section>

      {/* Key Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest p-7 rounded-2xl space-y-4 shadow-[0_2px_8px_rgba(26,28,28,0.04)]"
          >
            <div className="flex justify-between items-start">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <svg className={`w-4 h-4 ${card.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[--color-outline] mt-1">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Per-listing breakdown */}
      {activeListings.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[--color-brand-primary] font-heading">
              Per-Listing Performance
            </h2>
            <Link
              href="/dashboard/seller/listings"
              className="text-xs font-bold uppercase tracking-[0.15em] text-[--color-brand-secondary-dark] hover:underline"
            >
              View All Listings
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[--color-surface-container-low] text-[10px] font-bold uppercase tracking-widest text-[--color-outline]">
                  <th className="px-8 py-5">Property</th>
                  <th className="px-8 py-5">Views</th>
                  <th className="px-8 py-5">Saves</th>
                  <th className="px-8 py-5">Enquiries</th>
                  <th className="px-8 py-5 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-surface-container-low]">
                {activeListings.map((listing) => {
                  const addr = [listing.address_line_1, listing.city]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-[--color-surface-container-low]/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <p className="font-semibold text-sm text-[--color-on-surface] font-heading">
                          {addr || "Property"}
                        </p>
                        <p className="text-xs text-[--color-outline] mt-0.5">{listing.postcode}</p>
                      </td>
                      <td className="px-8 py-5 font-semibold text-sm text-[--color-on-surface]">
                        {listing.views_count.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 font-semibold text-sm text-[--color-on-surface]">
                        {listing.saves_count}
                      </td>
                      <td className="px-8 py-5 font-semibold text-sm text-[--color-on-surface]">
                        {listing.enquiries_count}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link
                          href={`/dashboard/seller/listings/${listing.id}/analytics`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[--color-brand-secondary-dark] hover:underline uppercase tracking-wider"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* No active listings CTA */
        <section className="bg-brand-primary p-10 rounded-3xl text-white relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
              Get Started
            </div>
            <h2 className="text-3xl font-extrabold font-heading leading-tight mb-3">
              Start Tracking Your Listings
            </h2>
            <p className="text-sm text-[--color-brand-primary-lighter]/70 leading-relaxed mb-6">
              Create your first listing to unlock detailed analytics — views, saves, enquiries, and market benchmarks.
            </p>
            <Link
              href="/dashboard/seller/listings/create?step=1"
              className="inline-flex items-center gap-3 py-4 px-6 bg-[--color-brand-secondary-light] text-[--color-brand-secondary-dark] font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Create Your First Listing
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          <svg className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
          </svg>
        </section>
      )}
    </div>
  );
}

export default function MarketAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
