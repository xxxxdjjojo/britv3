import { createClient } from "@/lib/supabase/server";
import { getReportedReviews } from "@/services/admin-service";
import { ReviewModerationQueueClient } from "@/components/admin/ReviewModerationQueueClient";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reports = await getReportedReviews(supabase);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Review Moderation</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review and resolve reported reviews. {reports.length} report
          {reports.length !== 1 ? "s" : ""} awaiting action.
        </p>
      </div>

      <ReviewModerationQueueClient
        reports={reports}
        adminId={user?.id ?? ""}
      />
    </div>
  );
}
