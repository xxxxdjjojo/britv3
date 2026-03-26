import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentOffers } from "@/services/agent/agent-offer-service";
import { OffersDashboard } from "@/components/dashboard/agent/offers/OffersDashboard";
import type { AgentOffer } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Offers - Agent Dashboard",
  description: "Manage property offers",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
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

export default function AgentOffersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
