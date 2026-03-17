import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSubscription } from "@/services/agent/agent-billing-service";
import { SubscriptionBilling } from "@/components/dashboard/agent/billing/SubscriptionBilling";

export const metadata = {
  title: "Billing - Britestate Agent",
  description: "Manage your Britestate subscription",
};

export default async function AgentBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let subscription: unknown = null;
  try {
    subscription = await getCurrentSubscription(supabase, user.id);
  } catch {
    // Stripe not configured or agent not found — show upsell UI
    subscription = null;
  }

  return <SubscriptionBilling subscription={subscription} />;
}
