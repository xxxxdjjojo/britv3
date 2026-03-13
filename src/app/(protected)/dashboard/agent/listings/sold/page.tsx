import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/services/agent/agent-listings-service";
import { SoldLetListings } from "@/components/dashboard/agent/listings/SoldLetListings";

export default async function SoldLetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let soldListings;
  let letListings;
  try {
    soldListings = await getAgentListings(supabase, user.id, { status: "sold" });
  } catch {
    soldListings = { data: [], count: 0 };
  }

  try {
    letListings = await getAgentListings(supabase, user.id, { status: "let" });
  } catch {
    letListings = { data: [], count: 0 };
  }

  return (
    <SoldLetListings
      soldListings={soldListings.data}
      letListings={letListings.data}
    />
  );
}
