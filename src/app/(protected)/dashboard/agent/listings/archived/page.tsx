import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { ArchivedDraftListings } from "@/components/dashboard/agent/listings/ArchivedDraftListings";

export const metadata = {
  title: "Archived & Draft Listings | Agent | Britestate",
};

export default async function AgentArchivedListingsPage() {
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
