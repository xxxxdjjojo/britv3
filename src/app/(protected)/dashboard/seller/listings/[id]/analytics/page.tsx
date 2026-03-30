import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, MessageSquare, MousePointer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32 mt-2" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params }: Props) {
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
    <div className="space-y-8 max-w-6xl">
      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/dashboard/seller/listings"
          className="inline-flex items-center gap-2 text-sm text-[--color-neutral-400] hover:text-[--color-neutral-700] transition-colors font-inter"
        >
          <ArrowLeft size={14} strokeWidth={1.25} />
          My Listings
        </Link>
        <h1 className="text-2xl font-bold text-[--color-neutral-900] font-['Plus_Jakarta_Sans'] tracking-tight mt-2">
          Listing Analytics
        </h1>
        <p className="text-[--color-neutral-500] mt-1 text-sm font-inter">{address}</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Views"
          value={summary.total_views.toLocaleString()}
          icon={Eye}
          iconBgClass="bg-[--color-info-light]"
          iconColorClass="text-[--color-info]"
        />
        <KpiCard
          label="Total Saves"
          value={summary.total_saves}
          icon={Heart}
          iconBgClass="bg-pink-50"
          iconColorClass="text-pink-500"
        />
        <KpiCard
          label="Enquiries"
          value={summary.total_enquiries}
          icon={MessageSquare}
          iconBgClass="bg-[--color-warning-light]"
          iconColorClass="text-[--color-warning]"
        />
        <KpiCard
          label="Click-Through Rate"
          value={`${summary.ctr}%`}
          icon={MousePointer}
          iconBgClass="bg-purple-50"
          iconColorClass="text-purple-600"
        />
      </div>

      {/* Charts */}
      <ListingAnalyticsCharts listingId={id} initialSummary={summary} />
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
