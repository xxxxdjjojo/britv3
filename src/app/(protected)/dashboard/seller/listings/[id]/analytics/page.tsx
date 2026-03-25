import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, MessageSquare, MousePointer } from "lucide-react";
import { KpiCard } from "@/components/seller/KpiCard";
import { getListingById } from "@/services/seller/listing-service";
import { getListingAnalyticsSummary } from "@/services/seller/analytics-service";

export const dynamic = "force-dynamic";

const ListingAnalyticsCharts = nextDynamic(
  () => import("@/components/seller/analytics/ListingAnalyticsCharts").then((mod) => mod.ListingAnalyticsCharts),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function ListingAnalyticsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [listing, summary] = await Promise.all([
    getListingById(supabase, id),
    getListingAnalyticsSummary(supabase, id, 30),
  ]);

  if (!listing) redirect("/dashboard/seller/listings");

  const address = [listing.address_line_1, listing.city].filter(Boolean).join(", ");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/seller/listings" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={16} />
          My Listings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-2">Analytics</h1>
        <p className="text-slate-500 mt-1">{address}</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Views" value={summary.total_views.toLocaleString()} icon={Eye} iconBgClass="bg-blue-100" iconColorClass="text-blue-600" />
        <KpiCard label="Total Saves" value={summary.total_saves} icon={Heart} iconBgClass="bg-pink-100" iconColorClass="text-pink-500" />
        <KpiCard label="Enquiries" value={summary.total_enquiries} icon={MessageSquare} iconBgClass="bg-orange-100" iconColorClass="text-orange-500" />
        <KpiCard label="Click-Through Rate" value={`${summary.ctr}%`} icon={MousePointer} iconBgClass="bg-purple-100" iconColorClass="text-purple-600" />
      </div>
      <ListingAnalyticsCharts listingId={id} initialSummary={summary} />
    </div>
  );
}
