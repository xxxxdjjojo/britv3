import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getReportedReviews } from "@/services/admin/review-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ReviewModerationQueueClient } from "@/components/admin/ReviewModerationQueueClient";
import { Star } from "lucide-react";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reports = await getReportedReviews(supabase);

  return (
    <div>
      <AdminPageHeader
        title="Review Moderation"
        description={`${reports.length} report${reports.length !== 1 ? "s" : ""} awaiting action.`}
      />

      {reports.length === 0 ? (
        <AdminEmptyState
          icon={Star}
          title="No reported reviews"
          description="All review reports have been resolved."
        />
      ) : (
        <ReviewModerationQueueClient
          reports={reports}
          adminId={user?.id ?? ""}
        />
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
