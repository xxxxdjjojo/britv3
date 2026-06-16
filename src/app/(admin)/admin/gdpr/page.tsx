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
        eyebrow="Operations"
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
