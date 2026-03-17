import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SubscriptionsClient } from "@/components/admin/SubscriptionsClient";
import { getSubscriptions } from "@/services/admin/subscription-service";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const subscriptions = await getSubscriptions(supabase);

  return (
    <div>
      <AdminPageHeader
        title="Subscription Management"
        description="View and manage user subscriptions."
      />
      <SubscriptionsClient subscriptions={subscriptions} />
    </div>
  );
}
