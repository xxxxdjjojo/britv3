import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getListingAnalytics } from "@/services/agent/agent-listings-service";
import { ListingAnalyticsCharts } from "@/components/dashboard/agent/listings/ListingAnalyticsCharts";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListingAnalyticsPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch the listing for the header
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, address_line_1, city, postcode, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!listing) {
    notFound();
  }

  let analytics = {
    views_over_time: [] as Array<{ date: string; count: number }>,
    total_views: 0,
    total_saves: 0,
    total_enquiries: 0,
  };

  try {
    analytics = await getListingAnalytics(supabase, id, user.id);
  } catch {
    // Fall through with zero values
  }

  const address = [listing.address_line_1, listing.city, listing.postcode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/agent/listings">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listing Analytics</h1>
          <p className="text-muted-foreground text-sm">{address || listing.title || id}</p>
        </div>
      </div>

      <ListingAnalyticsCharts analytics={analytics} />
    </div>
  );
}
