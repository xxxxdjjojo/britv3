import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { SoldLetListings } from "@/components/dashboard/agent/listings/SoldLetListings";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sold & Let Listings | Agent | Britestate",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let listings: Record<string, unknown>[] = [];

  try {
    const result = await getAgentListings(supabase, user.id, "sold");
    listings = result.listings as Record<string, unknown>[];
  } catch {
    // Service call failed — render with empty listings
  }

  return <SoldLetListings listings={listings} />;
}

export default function AgentSoldListingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
