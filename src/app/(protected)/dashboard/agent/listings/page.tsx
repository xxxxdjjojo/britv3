import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActiveListings } from "@/components/dashboard/agent/listings/ActiveListings";
import { getAgentListings } from "@/services/agent/agent-listings-service";

export default async function AgentListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let listings: Record<string, unknown>[] = [];
  try {
    const result = await getAgentListings(supabase, user.id, "active");
    listings = result.listings as Record<string, unknown>[];
  } catch {
    listings = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Listings</h1>
          <p className="text-muted-foreground">
            {listings.length} active propert{listings.length === 1 ? "y" : "ies"} on the market
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agent/listings/create">
            <Plus className="mr-2 size-4" />
            Add Listing
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/dashboard/agent/listings"
          className="font-medium text-foreground border-b-2 border-primary pb-1"
        >
          Active ({listings.length})
        </Link>
        <Link
          href="/dashboard/agent/listings/sold"
          className="text-muted-foreground hover:text-foreground"
        >
          Sold / Let
        </Link>
        <Link
          href="/dashboard/agent/listings/archived"
          className="text-muted-foreground hover:text-foreground"
        >
          Archived / Draft
        </Link>
      </div>

      <ActiveListings listings={listings} />
    </div>
  );
}
