import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuditLog } from "@/services/admin/audit-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AuditLogClient } from "@/components/admin/AuditLogClient";
import { ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 50;


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
  const action = typeof params.action === "string" ? params.action : undefined;
  const adminId = typeof params.adminId === "string" ? params.adminId : undefined;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;

  const supabase = await createClient();
  const entries = await getAuditLog(supabase, {
    action,
    adminId,
    cursor,
    limit: PAGE_LIMIT,
  });

  return (
    <div>
      <AdminPageHeader
        title="Audit Log"
        description="Chronological record of all admin actions."
      />

      {entries.length === 0 && !action && !adminId && !cursor ? (
        <AdminEmptyState
          icon={ClipboardList}
          title="No audit log entries"
          description="Admin actions will be recorded here automatically."
        />
      ) : (
        <AuditLogClient
          entries={entries}
          actionFilter={action ?? ""}
          adminIdFilter={adminId ?? ""}
          cursor={cursor}
          hasMore={entries.length === PAGE_LIMIT}
          limit={PAGE_LIMIT}
        />
      )}
    </div>
  );
}

export default function AuditLogPage({
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
