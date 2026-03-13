import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingAnalytics } from "@/services/agent/agent-listings-service";
import { ListingAnalyticsCharts } from "@/components/dashboard/agent/listings/ListingAnalyticsCharts";

export default async function ListingAnalyticsPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let analytics;
  try {
    analytics = await getListingAnalytics(supabase, id, user.id);
  } catch {
    analytics = {
      daily_views: [],
      total_views: 0,
      total_saves: 0,
      total_enquiries: 0,
    };
  }

  return <ListingAnalyticsCharts analytics={analytics} listingId={id} />;
}
