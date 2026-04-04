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
      <div className="rounded-xl bg-card p-8 text-center font-body text-sm text-neutral-500 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <table className="min-w-full divide-y divide-neutral-100/60 dark:divide-neutral-700/60 text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
            <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</th>
            <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-neutral-100/60 dark:border-neutral-700/60 hover:bg-muted/30 transition-colors last:border-0">
              <td className="px-4 py-3 font-body text-sm font-medium text-foreground">
                {user.display_name ?? "—"}
              </td>
              <td className="px-4 py-3 font-body text-sm text-neutral-500">{user.email ?? "—"}</td>
              <td className="px-4 py-3 font-body text-sm text-neutral-500">{user.active_role ?? "—"}{user.is_admin ? " (Admin)" : ""}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${
                    user.is_suspended
                      ? "bg-error-light text-error dark:bg-error/20 dark:text-error"
                      : "bg-success-light text-success dark:bg-success/20 dark:text-success"
                  }`}
                >
                  {user.is_suspended ? "Suspended" : "Active"}
                </span>
              </td>
              <td className="px-4 py-3 font-body text-sm text-neutral-500">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-GB")
                  : "—"}
              </td>
              <td className="flex items-center gap-2 px-4 py-3">
                {user.is_suspended ? (
                  <button
                    onClick={() => onActivate(user.id)}
                    className="rounded-lg bg-brand-primary px-2.5 py-1.5 font-body text-xs font-medium text-white hover:bg-brand-primary/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => onSuspend(user.id)}
                    className="rounded-lg bg-destructive px-2.5 py-1.5 font-body text-xs font-medium text-white hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                  >
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => onViewDetails(user)}
                  className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-2.5 py-1.5 font-body text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
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
