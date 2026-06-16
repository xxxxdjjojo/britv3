"use client";

import type { UserSearchResult } from "@/services/admin/user-service";

type Props = Readonly<{
  user: UserSearchResult | null;
  open: boolean;
  onClose: () => void;
}>;

export function UserDetailModal({ user, open, onClose }: Props) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">User Details</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-neutral-500">Name</dt>
            <dd className="mt-0.5 text-neutral-900">{user.display_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Email</dt>
            <dd className="mt-0.5 text-neutral-900">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Role</dt>
            <dd className="mt-0.5 text-neutral-900">{user.active_role ?? "—"}{user.is_admin ? " (Admin)" : ""}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.is_suspended
                    ? "bg-error-light text-error"
                    : "bg-success-light text-success"
                }`}
              >
                {user.is_suspended ? "Suspended" : "Active"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">User ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-neutral-600">{user.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Created</dt>
            <dd className="mt-0.5 text-neutral-900">
              {user.created_at
                ? new Date(user.created_at).toLocaleString("en-GB")
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
