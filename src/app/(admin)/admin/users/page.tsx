import { createClient } from "@/lib/supabase/server";
import { searchUsers } from "@/services/admin/user-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserManagementClient } from "@/components/admin/UserManagementClient";

const PAGE_LIMIT = 20;

export default async function AdminUsersPage({
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
        eyebrow="Moderation"
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
