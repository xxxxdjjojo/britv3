import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { listApplications } from "@/services/landlord/tenant-application-service";
import { TenantScreeningClient } from "@/components/landlord/TenantScreeningClient";
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

  const applications = await listApplications(supabase).catch(() => []);

  return <TenantScreeningClient initialApplications={applications} />;
}

export default function TenantsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
