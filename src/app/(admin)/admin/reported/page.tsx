import { createClient } from "@/lib/supabase/server";
import { getOpenReports } from "@/services/admin/report-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { ReportedContentClient } from "@/components/admin/ReportedContentClient";
import { Flag } from "lucide-react";

export default async function AdminReportedPage() {
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
