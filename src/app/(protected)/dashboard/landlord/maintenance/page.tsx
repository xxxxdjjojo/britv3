import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioMaintenanceRequests } from "@/services/landlord/maintenance-service";
import { MaintenanceInboxClient } from "./MaintenanceInboxClient";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";


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
  const requests = await getPortfolioMaintenanceRequests(supabase);

  return <MaintenanceInboxClient initialData={requests} />;
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
