import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserDetail } from "@/services/admin/user-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { UserDetailActions } from "@/components/admin/UserDetailActions";
import { UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUserDetail(supabase, id);

  if (!user) {
    return (
      <div>
        <AdminPageHeader title="User Detail" />
        <AdminEmptyState
          icon={UserX}
          title="User not found"
          description="This user does not exist or has been deleted."
        />
      </div>
    );
  }

  const isBanned = Boolean(user.ban_reason || user.banned_at);
  const userStatus = isBanned ? "banned" : user.is_suspended ? "suspended" : "active";

  return (
    <div>
      <AdminPageHeader
        title={user.display_name ?? "Unknown User"}
        description={user.email ?? undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2
              className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4"
            >
              Account Details
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-500">Full Name</dt>
                <dd className="mt-0.5 text-sm font-medium text-neutral-900">
                  {user.display_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Email</dt>
                <dd className="mt-0.5 text-sm font-medium text-neutral-900">
                  {user.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Role</dt>
                <dd className="mt-0.5 text-sm font-medium text-neutral-900 capitalize">
                  {user.active_role ?? "—"}{user.is_admin ? " (Admin)" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Verification Level</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={user.verification_level ?? "basic"} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Account Status</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={userStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Member Since</dt>
                <dd className="mt-0.5 text-sm font-medium text-neutral-900">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
              {user.banned_at && (
                <div>
                  <dt className="text-xs text-neutral-500">Banned At</dt>
                  <dd className="mt-0.5 text-sm font-medium text-neutral-900">
                    {new Date(user.banned_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
              {user.ban_reason && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-neutral-500">Ban Reason</dt>
                  <dd className="mt-0.5 text-sm font-medium text-error">
                    {user.ban_reason}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Actions panel */}
        <div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">
              Actions
            </h2>
            <UserDetailActions userId={user.id} isSuspended={user.is_suspended ?? false} isBanned={isBanned} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
