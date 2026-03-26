import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOpenReports } from "@/services/admin/report-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ReportedContentClient } from "@/components/admin/ReportedContentClient";
import { Flag } from "lucide-react";
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
  const reportList = await getOpenReports(supabase);

  return (
    <div>
      <AdminPageHeader
        title="Reported Content"
        description={`${reportList.length} report${reportList.length !== 1 ? "s" : ""} awaiting review`}
      />
      {reportList.length === 0 ? (
        <AdminEmptyState
          icon={Flag}
          title="No pending reports"
          description="All content reports have been reviewed."
        />
      ) : (
        <ReportedContentClient reports={reportList} />
      )}
    </div>
  );
}

export default function AdminReportedPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
