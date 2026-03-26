import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getVerificationQueue } from "@/services/admin/verification-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { VerificationQueueClient } from "@/components/admin/VerificationQueueClient";
import { BadgeCheck } from "lucide-react";
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
  const verifications = await getVerificationQueue(supabase);

  return (
    <div>
      <AdminPageHeader
        title="Provider Verifications"
        description={`${verifications.length} item${verifications.length !== 1 ? "s" : ""} awaiting review.`}
      />

      {verifications.length === 0 ? (
        <AdminEmptyState
          icon={BadgeCheck}
          title="No pending verifications"
          description="All provider verification applications have been reviewed."
        />
      ) : (
        <VerificationQueueClient verifications={verifications} />
      )}
    </div>
  );
}

export default function AdminVerificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
