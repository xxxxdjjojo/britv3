import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type RoleCount = { role: string; count: number };
type StatusCount = { status: string; count: number };

type PlatformAnalytics = {
  dau: number;
  mau: number;
  totalUsers: number;
  totalProperties: number;
  totalMessages: number;
  usersByRole: RoleCount[];
  listingsByStatus: StatusCount[];
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  const supabase = await createClient();

  const safeCount = async (query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> => {
    try {
      const { count, error } = await query;
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    dau,
    mau,
    totalUsers,
    totalProperties,
    totalMessages,
    roleRows,
    statusRows,
  ] = await Promise.all([
    // DAU — distinct users active today via admin_audit_log
    safeCount(
      supabase
        .from("admin_audit_log")
        .select("admin_id", { count: "exact", head: true })
        .gte("created_at", today),
    ),
    // MAU — distinct profiles updated/created in last 30 days
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo),
    ),
    safeCount(
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ),
    safeCount(
      supabase.from("properties").select("id", { count: "exact", head: true }),
    ),
    safeCount(
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ),
    // Users by role
    supabase.from("profiles").select("role"),
    // Listings by status
    supabase.from("properties").select("status"),
  ]);

  // Aggregate role counts client-side (avoids needing group-by RPC)
  const roleMap: Record<string, number> = {};
  if (roleRows.data) {
    for (const row of roleRows.data as Array<{ role: string | null }>) {
      const r = row.role ?? "unknown";
      roleMap[r] = (roleMap[r] ?? 0) + 1;
    }
  }
  const usersByRole: RoleCount[] = Object.entries(roleMap)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  const statusMap: Record<string, number> = {};
  if (statusRows.data) {
    for (const row of statusRows.data as Array<{ status: string | null }>) {
      const s = row.status ?? "unknown";
      statusMap[s] = (statusMap[s] ?? 0) + 1;
    }
  }
  const listingsByStatus: StatusCount[] = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    dau,
    mau,
    totalUsers,
    totalProperties,
    totalMessages,
    usersByRole,
    listingsByStatus,
  };
}

// ── Main section (async) ──────────────────────────────────────────────────────

async function PlatformMetricsContent() {
  const analytics = await fetchPlatformAnalytics();

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Admin Actions Today" value={analytics.dau.toLocaleString("en-GB")} icon="TrendingUp" />
        <StatCard label="Active Users (30d)" value={analytics.mau.toLocaleString("en-GB")} icon="TrendingUp" />
        <StatCard label="Total Users" value={analytics.totalUsers.toLocaleString("en-GB")} icon="Users" />
        <StatCard label="Total Properties" value={analytics.totalProperties.toLocaleString("en-GB")} icon="Building2" />
        <StatCard label="Total Messages" value={analytics.totalMessages.toLocaleString("en-GB")} icon="MessageSquare" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-base font-semibold text-neutral-900 mb-4">
            Users by Role
          </h2>
          {analytics.usersByRole.length === 0 ? (
            <p className="text-sm text-neutral-400">No data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left pb-2 font-medium text-neutral-500">Role</th>
                  <th className="text-right pb-2 font-medium text-neutral-500">Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.usersByRole.map(({ role, count }) => (
                  <tr key={role} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2 capitalize text-neutral-700">{role.replace(/_/g, " ")}</td>
                    <td className="py-2 text-right font-mono text-neutral-900">
                      {count.toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Listings by Status */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-base font-semibold text-neutral-900 mb-4">
            Listings by Status
          </h2>
          {analytics.listingsByStatus.length === 0 ? (
            <p className="text-sm text-neutral-400">No data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left pb-2 font-medium text-neutral-500">Status</th>
                  <th className="text-right pb-2 font-medium text-neutral-500">Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.listingsByStatus.map(({ status, count }) => (
                  <tr key={status} className="border-b border-neutral-50 last:border-0">
                    <td className="py-2 capitalize text-neutral-700">{status.replace(/_/g, " ")}</td>
                    <td className="py-2 text-right font-mono text-neutral-900">
                      {count.toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlatformMetricsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Platform Metrics"
        description="Real-time aggregate statistics from the TrueDeed platform database."
      />
      <Suspense fallback={<MetricsSkeleton />}>
        <PlatformMetricsContent />
      </Suspense>
    </div>
  );
}
