import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPlatformMetrics, getMonthlyRevenue } from "@/services/admin/analytics-service";
import { getAuditLog } from "@/services/admin/audit-service";
import { StatCard } from "@/components/dashboard/StatCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDashboardCharts } from "@/components/admin/AdminDashboardCharts";
import { Skeleton } from "@/components/ui/skeleton";

async function KpiCards() {
  const supabase = await createClient();
  const metrics = await getPlatformMetrics(supabase);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Link href="/admin/users" className="block">
        <StatCard label="Total Users" value={metrics.totalUsers.toLocaleString()} icon="Users" />
      </Link>
      <Link href="/admin/moderation" className="block">
        <StatCard label="Active Listings" value={metrics.activeListings.toLocaleString()} icon="Building2" />
      </Link>
      <Link href="/admin/verifications" className="block">
        <StatCard label="Pending Verifications" value={metrics.pendingVerifications.toLocaleString()} icon="BadgeCheck" />
      </Link>
      <Link href="/admin/reported" className="block">
        <StatCard label="Open Reports" value={metrics.openReports.toLocaleString()} icon="ShieldAlert" />
      </Link>
      <Link href="/admin/reviews" className="block">
        <StatCard label="Total Reviews" value={metrics.totalReviews.toLocaleString()} icon="Star" />
      </Link>
    </div>
  );
}

async function ActivityFeed() {
  const supabase = await createClient();
  const entries = await getAuditLog(supabase, { limit: 10 });

  if (entries.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">No recent activity.</p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {entries.map((entry) => (
        <li key={entry.id} className="py-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">
              {entry.action}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {entry.target_type} &middot; {entry.target_id.slice(0, 8)}…
            </p>
          </div>
          <time className="shrink-0 text-xs text-neutral-400">
            {new Date(entry.created_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </li>
      ))}
    </ul>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

async function RevenueChart() {
  const supabase = await createClient();
  const revenueData = await getMonthlyRevenue(supabase);
  return <AdminDashboardCharts data={revenueData} />;
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded" />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Overview"
        title="Admin Dashboard"
        description="Overview of platform activity and content moderation."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <KpiCards />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-heading text-base font-semibold text-neutral-900 mb-4">
              Platform Revenue (last 7 months)
            </h2>
            <Suspense fallback={<ChartSkeleton />}>
              <RevenueChart />
            </Suspense>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2
            className="font-heading text-base font-semibold text-neutral-900 mb-4"
          >
            Recent Activity
          </h2>
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivityFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
