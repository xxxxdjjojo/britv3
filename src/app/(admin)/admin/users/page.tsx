import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { searchUsers } from "@/services/admin/user-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserManagementClient } from "@/components/admin/UserManagementClient";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = 20;


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
  const query = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? Math.max(0, parseInt(params.page, 10)) : 0;

  const supabase = await createClient();
  const { users, total } = await searchUsers(supabase, query, page, PAGE_LIMIT);

  return (
    <div>
      <AdminPageHeader
        title="User Management"
        description="Search, view, suspend, ban, and activate user accounts."
      />

      <UserManagementClient
        initialUsers={users}
        total={total}
        page={page}
        limit={PAGE_LIMIT}
        query={query}
      />
    </div>
  );
}

export default function AdminUsersPage({
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
