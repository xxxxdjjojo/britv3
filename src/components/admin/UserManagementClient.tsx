"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserSearchResult } from "@/services/admin/user-service";
import { UserTable } from "@/components/admin/UserTable";
import { UserDetailModal } from "@/components/admin/UserDetailModal";

type Props = Readonly<{
  initialUsers: UserSearchResult[];
  total: number;
  page: number;
  limit: number;
  query: string;
}>;

export function UserManagementClient({
  initialUsers,
  total,
  page,
  limit,
  query,
}: Props) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [search, setSearch] = useState(query);

  const totalPages = Math.ceil(total / limit);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", "0");
    router.push(`/admin/users?${params.toString()}`);
  }

  function buildPageHref(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(p));
    return `/admin/users?${params.toString()}`;
  }

  async function handleSuspend(userId: string) {
    await fetch(`/api/admin/users/${userId}/suspend`, { method: "POST" });
    router.refresh();
  }

  async function handleActivate(userId: string) {
    await fetch(`/api/admin/users/${userId}/activate`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        {total} user{total !== 1 ? "s" : ""} found
      </p>

      <UserTable
        users={initialUsers}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
        onViewDetails={setSelectedUser}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <a
                href={buildPageHref(page - 1)}
                className="rounded border border-neutral-300 px-3 py-1 hover:bg-muted"
              >
                Previous
              </a>
            )}
            {page + 1 < totalPages && (
              <a
                href={buildPageHref(page + 1)}
                className="rounded border border-neutral-300 px-3 py-1 hover:bg-muted"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        open={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
