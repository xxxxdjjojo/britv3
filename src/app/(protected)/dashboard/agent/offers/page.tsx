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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Offer Management
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark mt-1">
            Offers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and manage buyer offers on your listings
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary-dark"
        >
          Export Report
        </button>
      </div>
      <OffersDashboard grouped={grouped} />
    </div>
  );
}
