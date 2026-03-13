import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSubscription } from "@/services/agent/agent-billing-service";
import { SubscriptionBilling } from "@/components/dashboard/agent/billing/SubscriptionBilling";

export default async function AgentBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let subscription: Record<string, unknown> | null = null;
  try {
    subscription = await getCurrentSubscription(supabase, user.id);
  } catch {
    subscription = null;
  }

  return <SubscriptionBilling subscription={subscription} />;
}
