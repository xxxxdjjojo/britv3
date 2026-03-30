import Link from "next/link";
import { BarChart2, ArrowRight } from "lucide-react";

export default function MarketAnalyticsPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-neutral-900] font-['Plus_Jakarta_Sans'] tracking-tight">
          Market Analytics
        </h1>
        <p className="text-[--color-neutral-500] mt-1 text-sm font-inter">
          Track performance across all your listings
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-lg mx-auto">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-[--color-brand-primary-lighter] flex items-center justify-center mb-5">
          <BarChart2 className="h-8 w-8 text-[--color-brand-primary]" strokeWidth={1.25} />
        </div>
        <h2 className="text-xl font-bold text-[--color-neutral-900] font-['Plus_Jakarta_Sans']">
          Market Analytics
        </h2>
        <p className="text-[--color-neutral-500] mt-3 text-sm font-inter leading-relaxed">
          Market-wide analytics are coming soon. In the meantime, view detailed per-listing analytics from your listings page.
        </p>
        <Link
          href="/dashboard/seller/listings"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[--color-brand-primary] text-white text-sm font-semibold hover:bg-[--color-brand-primary-light] transition-colors font-inter"
        >
          View My Listings
          <ArrowRight size={14} strokeWidth={1.25} />
        </Link>
      </div>
    </div>
  );
}
