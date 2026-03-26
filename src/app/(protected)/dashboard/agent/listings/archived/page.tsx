import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { ArchivedDraftListings } from "@/components/dashboard/agent/listings/ArchivedDraftListings";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Archived & Draft Listings | Agent | Britestate",
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
    const result = await getAgentListings(supabase, user.id);
    listings = result.listings as Record<string, unknown>[];
  } catch {
    // Service call failed — render with empty listings
  }

  return <ArchivedDraftListings listings={listings} />;
}

export default function AgentArchivedListingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
