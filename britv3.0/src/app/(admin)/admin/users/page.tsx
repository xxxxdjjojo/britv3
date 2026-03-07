import { createClient } from "@/lib/supabase/server";
import { searchUsers } from "@/services/admin-service";
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search, view, suspend, and activate user accounts.
        </p>
      </div>

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
