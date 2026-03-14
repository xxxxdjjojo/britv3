import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentOffers } from "@/services/agent/agent-offer-service";
import { OffersDashboard } from "@/components/dashboard/agent/offers/OffersDashboard";

export default async function AgentOffersPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let offers: Awaited<ReturnType<typeof getAgentOffers>> = [];

  try {
    offers = await getAgentOffers(supabase, user.id);
  } catch {
    // Graceful fallback — table may not exist in all environments
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground">
          Manage buyer offers and negotiate on behalf of your vendors
        </p>
      </div>
      <OffersDashboard initialOffers={offers} agentId={user.id} />
    </div>
  );
}
