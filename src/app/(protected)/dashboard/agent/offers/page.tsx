import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentOffers } from "@/services/agent/agent-offer-service";
import { OffersDashboard } from "@/components/dashboard/agent/offers/OffersDashboard";
import type { AgentOffer } from "@/types/agent";

export default async function OffersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let offers: AgentOffer[] = [];
  try {
    offers = await getAgentOffers(supabase, user.id);
  } catch {
    offers = [];
  }

  return <OffersDashboard initialOffers={offers} />;
}
