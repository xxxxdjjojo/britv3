import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOfferById, getOfferHistory } from "@/services/agent/agent-offer-service";
import { NegotiationThread } from "@/components/dashboard/agent/offers/NegotiationThread";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Offer Negotiation - Agent Dashboard",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const offerWithHistory = await getOfferById(supabase, id, user.id).catch(
    () => null,
  );

  if (!offerWithHistory) {
    notFound();
  }

  const { history, ...offer } = offerWithHistory;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offer Negotiation</h1>
        <p className="text-muted-foreground">
          Review and respond to this buyer offer
        </p>
      </div>
      <NegotiationThread offer={offer} history={history} />
    </div>
  );
}

export default function OfferDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
