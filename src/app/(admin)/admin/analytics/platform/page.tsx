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
  newUsers30d: number;
  totalUsers: number;
  totalProperties: number;
  totalMessages: number;
  usersByRole: RoleCount[];
  listingsByStatus: StatusCount[];
  recentSignups: Array<{ created_at: string }>;
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
  const eightyFourDaysAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString();

  const [
    dau,
    mau,
    newUsers30d,
    totalUsers,
    totalProperties,
    totalMessages,
    roleRows,
    statusRows,
    signupRows,
  ] = await Promise.all([
    // Admin actions today — rows in admin_audit_log since midnight
    safeCount(
      supabase
        .from("admin_audit_log")
        .select("admin_id", { count: "exact", head: true })
        .gte("created_at", today),
    ),
    // Profiles updated in last 30 days (profile edits, not DAU)
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo),
    ),
    // New signups in last 30 days
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
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
    // Recent signups for growth table (last 84 days = 12 weeks)
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", eightyFourDaysAgo)
      .order("created_at", { ascending: true })
      .limit(2000),
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
    newUsers30d,
    totalUsers,
    totalProperties,
    totalMessages,
    usersByRole,
    listingsByStatus,
    recentSignups: (signupRows.data ?? []) as Array<{ created_at: string }>,
  };
}

// ── Main section (async) ──────────────────────────────────────────────────────

async function PlatformMetricsContent() {
  const analytics = await fetchPlatformAnalytics();

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Admin Actions Today (last 24h)" value={analytics.dau.toLocaleString("en-GB")} icon="TrendingUp" />
        <StatCard label="Profiles Updated (30d)" value={analytics.mau.toLocaleString("en-GB")} icon="TrendingUp" />
        <StatCard label="New Users (30d)" value={analytics.newUsers30d.toLocaleString("en-GB")} icon="Users" />
        <StatCard label="Total Users" value={analytics.totalUsers.toLocaleString("en-GB")} icon="Users" />
        <StatCard label="Total Properties" value={analytics.totalProperties.toLocaleString("en-GB")} icon="Building2" />
        <StatCard label="Total Messages" value={analytics.totalMessages.toLocaleString("en-GB")} icon="MessageSquare" />
      </div>

      {/* User Growth Table */}
      <UserGrowthTable signups={analytics.recentSignups} />

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

// ── User Growth Table ─────────────────────────────────────────────────────────

function UserGrowthTable({ signups }: { signups: Array<{ created_at: string }> }) {
  // Group by ISO week (YYYY-Www)
  const weekMap: Record<string, number> = {};
  for (const { created_at } of signups) {
    const d = new Date(created_at);
    // ISO week: get Thursday of the week, then derive year and week number
    const thursday = new Date(d);
    thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    const year = thursday.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNum = Math.ceil(
      ((thursday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    const key = `${year}-W${String(weekNum).padStart(2, "0")}`;
    weekMap[key] = (weekMap[key] ?? 0) + 1;
  }

  const rows = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<Array<{ week: string; newUsers: number; cumulative: number }>>(
      (acc, [week, newUsers]) => {
        const prev = acc[acc.length - 1];
        acc.push({ week, newUsers, cumulative: (prev?.cumulative ?? 0) + newUsers });
        return acc;
      },
      [],
    );

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-heading text-base font-semibold text-neutral-900 mb-4">
        User Growth (last 12 weeks)
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left pb-2 font-medium text-neutral-500">Week</th>
            <th className="text-right pb-2 font-medium text-neutral-500">New Users</th>
            <th className="text-right pb-2 font-medium text-neutral-500">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ week, newUsers, cumulative }) => (
            <tr key={week} className="border-b border-neutral-50 last:border-0">
              <td className="py-2 font-mono text-neutral-700">{week}</td>
              <td className="py-2 text-right font-mono text-neutral-900">
                {newUsers.toLocaleString("en-GB")}
              </td>
              <td className="py-2 text-right font-mono text-neutral-500">
                {cumulative.toLocaleString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
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
