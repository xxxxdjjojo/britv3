import { createClient } from "@/lib/supabase/server";
import { getReportedReviews } from "@/services/admin/review-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ReviewModerationQueueClient } from "@/components/admin/ReviewModerationQueueClient";
import { Star } from "lucide-react";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reports = await getReportedReviews(supabase);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Moderation"
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
