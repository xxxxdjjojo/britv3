import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { SoldLetListings } from "@/components/dashboard/agent/listings/SoldLetListings";

export const metadata = {
  title: "Sold & Let Listings | Agent | Britestate",
};

export default async function AgentSoldListingsPage() {
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
