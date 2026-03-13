import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { ActiveListings } from "@/components/dashboard/agent/listings/ActiveListings";

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let listings;
  try {
    listings = await getAgentListings(supabase, user.id, { status: "active" });
  } catch {
    listings = { data: [], count: 0 };
  }

  return <ActiveListings listings={listings.data} count={listings.count} />;
}
