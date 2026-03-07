"use client";

import type { UserSearchResult } from "@/services/admin-service";

type Props = Readonly<{
  users: UserSearchResult[];
  onSuspend: (userId: string) => void;
  onActivate: (userId: string) => void;
  onViewDetails: (user: UserSearchResult) => void;
}>;

export function UserTable({ users, onSuspend, onActivate, onViewDetails }: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {user.full_name ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-600">{user.email ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600">{user.role ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.is_suspended
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {user.is_suspended ? "Suspended" : "Active"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-GB")
                  : "—"}
              </td>
              <td className="flex items-center gap-2 px-4 py-3">
                {user.is_suspended ? (
                  <button
                    onClick={() => onActivate(user.id)}
                    className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => onSuspend(user.id)}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => onViewDetails(user)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
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
