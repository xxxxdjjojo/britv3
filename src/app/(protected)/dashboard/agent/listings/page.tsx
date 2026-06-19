import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { ActiveListings } from "@/components/dashboard/agent/listings/ActiveListings";

export const metadata = {
  title: "Active Listings | Agent | TrueDeed",
};

export default async function AgentListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let listings: Record<string, unknown>[] = [];

  try {
    const result = await getAgentListings(supabase, user.id, "active");
    listings = result.listings as Record<string, unknown>[];
  } catch {
    // Service call failed — render with empty listings
  }

  return <ActiveListings listings={listings} />;
}
