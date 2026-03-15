import { createClient } from "@/lib/supabase/server";
import { getGdprQueue } from "@/services/admin/gdpr-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { GdprQueueClient } from "@/components/admin/GdprQueueClient";
import { ShieldCheck } from "lucide-react";

export default async function GdprQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const statusFilter =
    typeof params.status === "string" ? params.status : "all";

  const supabase = await createClient();
  const allRequests = await getGdprQueue(supabase);

  const requests =
    statusFilter === "all"
      ? allRequests
      : allRequests.filter((r) => r.status === statusFilter);

  return (
    <div>
      <AdminPageHeader
        title="GDPR Queue"
        description="Manage data export and deletion requests from users."
      />

      {allRequests.length === 0 ? (
        <AdminEmptyState
          icon={ShieldCheck}
          title="No GDPR requests"
          description="User data requests will appear here when submitted."
        />
      ) : (
        <GdprQueueClient
          requests={requests}
          allRequests={allRequests}
          statusFilter={statusFilter}
        />
      )}
    </div>
  );
}
