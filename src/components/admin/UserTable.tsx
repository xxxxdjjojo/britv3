"use client";

import type { UserSearchResult } from "@/services/admin/user-service";

type Props = Readonly<{
  users: UserSearchResult[];
  onSuspend: (userId: string) => void;
  onActivate: (userId: string) => void;
  onViewDetails: (user: UserSearchResult) => void;
}>;

export function UserTable({ users, onSuspend, onActivate, onViewDetails }: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Role</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Created</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 font-medium text-neutral-900">
                {user.full_name ?? "—"}
              </td>
              <td className="px-4 py-3 text-neutral-600">{user.email ?? "—"}</td>
              <td className="px-4 py-3 text-neutral-600">{user.role ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.is_suspended
                      ? "bg-error-light text-error"
                      : "bg-success-light text-success"
                  }`}
                >
                  {user.is_suspended ? "Suspended" : "Active"}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-GB")
                  : "—"}
              </td>
              <td className="flex items-center gap-2 px-4 py-3">
                {user.is_suspended ? (
                  <button
                    onClick={() => onActivate(user.id)}
                    className="rounded bg-success px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => onSuspend(user.id)}
                    className="rounded bg-error px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                  >
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => onViewDetails(user)}
                  className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
