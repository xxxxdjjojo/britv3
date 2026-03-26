import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingAnalytics } from "@/services/agent/agent-listings-service";
import { Skeleton } from "@/components/ui/skeleton";

const ListingAnalyticsCharts = dynamic(
  () => import("@/components/dashboard/agent/listings/ListingAnalyticsCharts").then((mod) => mod.ListingAnalyticsCharts),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export const metadata = {
  title: "Listing Analytics | Agent | Britestate",
};

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const DEFAULT_ANALYTICS = {
    views_over_time: [] as Array<{ date: string; count: number }>,
    total_views: 0,
    total_saves: 0,
    total_enquiries: 0,
  };

  let analytics = DEFAULT_ANALYTICS;

  try {
    analytics = await getListingAnalytics(supabase, id, user.id);
  } catch {
    // Listing not found or access denied — render with zero analytics
  }

  return <ListingAnalyticsCharts analytics={analytics} />;
}

export default function ListingAnalyticsPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
