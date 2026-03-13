import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOfferById } from "@/services/agent/agent-offer-service";
import { NegotiationThread } from "@/components/dashboard/agent/offers/NegotiationThread";

export default async function OfferNegotiationPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const { offer, history } = await getOfferById(supabase, id, user.id);
    return <NegotiationThread offer={offer} history={history} />;
  } catch {
    notFound();
  }
}
