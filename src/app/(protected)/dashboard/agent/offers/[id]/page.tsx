import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOfferById } from "@/services/agent/agent-offer-service";
import { NegotiationThread } from "@/components/dashboard/agent/offers/NegotiationThread";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function AgentOfferDetailPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { id } = await params;

  let offerWithHistory: Awaited<ReturnType<typeof getOfferById>> | null = null;

  try {
    offerWithHistory = await getOfferById(supabase, id, user.id);
  } catch {
    // Offer not found or access denied
  }

  if (!offerWithHistory) {
    notFound();
  }

  const { history, ...offer } = offerWithHistory;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offer Negotiation</h1>
        <p className="text-muted-foreground">
          View offer details, history, and take negotiation actions
        </p>
      </div>
      <NegotiationThread offer={offer} history={history} />
    </div>
  );
}
