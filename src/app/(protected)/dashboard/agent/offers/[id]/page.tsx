import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOfferById, getOfferHistory } from "@/services/agent/agent-offer-service";
import { NegotiationThread } from "@/components/dashboard/agent/offers/NegotiationThread";

export const metadata = {
  title: "Offer Negotiation - Agent Dashboard",
};

export default async function OfferDetailPage({
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
