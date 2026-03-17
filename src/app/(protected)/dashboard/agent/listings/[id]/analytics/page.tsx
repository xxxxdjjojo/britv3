import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingAnalytics } from "@/services/agent/agent-listings-service";
import { ListingAnalyticsCharts } from "@/components/dashboard/agent/listings/ListingAnalyticsCharts";

export const metadata = {
  title: "Listing Analytics | Agent | Britestate",
};

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function ListingAnalyticsPage({ params }: Props) {
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
