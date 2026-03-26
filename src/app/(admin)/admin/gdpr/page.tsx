import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getGdprQueue } from "@/services/admin/gdpr-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { GdprQueueClient } from "@/components/admin/GdprQueueClient";
import { ShieldCheck } from "lucide-react";
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

async function PageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const statusFilter =
    typeof params.status === "string" ? params.status : "all";
  const page =
    typeof params.page === "string"
      ? Math.max(0, parseInt(params.page, 10) || 0)
      : 0;
  const limit = 50;

  const supabase = await createClient();

  const { requests, total } = await getGdprQueue(supabase, page, limit);

  return (
    <div>
      <AdminPageHeader
        title="GDPR Queue"
        description="Manage data export and deletion requests from users."
      />

      {total === 0 && page === 0 ? (
        <AdminEmptyState
          icon={ShieldCheck}
          title="No GDPR requests"
          description="User data requests will appear here when submitted."
        />
      ) : (
        <GdprQueueClient
          requests={requests}
          allRequests={requests}
          statusFilter={statusFilter}
        />
      )}
    </div>
  );
}

export default function GdprQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent searchParams={searchParams} />
    </Suspense>
  );
}
