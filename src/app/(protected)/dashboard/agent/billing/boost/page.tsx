import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeaturedListingBoost } from "@/components/dashboard/agent/billing/FeaturedListingBoost";

export default async function FeaturedBoostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch active listings for selection
  let listings: Array<{ id: string; title: string; address: string }> = [];
  try {
    const { data } = await supabase
      .from("agent_listings")
      .select("id, title, address_line_1")
      .eq("agent_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    listings = (data ?? []).map((l) => {
      const row = l as Record<string, unknown>;
      return {
        id: row.id as string,
        title: (row.title as string) ?? "Untitled Listing",
        address: (row.address_line_1 as string) ?? "",
      };
    });
  } catch {
    listings = [];
  }

  return <FeaturedListingBoost listings={listings} />;
}
