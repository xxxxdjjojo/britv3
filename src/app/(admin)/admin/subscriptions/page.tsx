import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SubscriptionsClient } from "@/components/admin/SubscriptionsClient";
import { getSubscriptions } from "@/services/admin/subscription-service";
import { Skeleton } from "@/components/ui/skeleton";


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

export default function AdminSubscriptionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
