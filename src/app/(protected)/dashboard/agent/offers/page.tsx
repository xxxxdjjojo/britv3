import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentOffers } from "@/services/agent/agent-offer-service";
import { OffersDashboard } from "@/components/dashboard/agent/offers/OffersDashboard";
import type { AgentOffer } from "@/types/agent";

export const metadata = {
  title: "Offers - Agent Dashboard",
  description: "Manage property offers",
};

export default async function AgentOffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const offers = await getAgentOffers(supabase, user.id).catch(() => [] as AgentOffer[]);

  const grouped = offers.reduce<Record<string, AgentOffer[]>>((acc, offer) => {
    const key = offer.property_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(offer);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground">
          Review and manage buyer offers on your listings
        </p>
      </div>
      <OffersDashboard grouped={grouped} />
    </div>
  );
}
