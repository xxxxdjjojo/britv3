import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSubscription } from "@/services/agent/agent-billing-service";
import { SubscriptionBilling } from "@/components/dashboard/agent/billing/SubscriptionBilling";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Billing - Britestate Agent",
  description: "Manage your Britestate subscription",
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

  let subscription: unknown = null;
  try {
    subscription = await getCurrentSubscription(supabase, user.id);
  } catch {
    // Stripe not configured or agent not found — show upsell UI
    subscription = null;
  }

  return <SubscriptionBilling subscription={subscription} />;
}

export default function AgentBillingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
