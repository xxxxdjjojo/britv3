import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMaintenanceRequests } from "@/services/landlord/maintenance-service";
import { MaintenanceList } from "@/components/landlord/MaintenanceList";
import { MAINTENANCE_STATUSES, MAINTENANCE_PRIORITIES } from "@/types/landlord";
import type { MaintenanceStatus, MaintenancePriority } from "@/types/landlord";
import { redirect } from "next/navigation";
import Link from "next/link";
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

async function PageContent(
  props: Readonly<{
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; priority?: string }>;
  }>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: propertyId } = await props.params;
  const searchParams = await props.searchParams;

  const statusFilter =
    searchParams.status &&
    MAINTENANCE_STATUSES.includes(searchParams.status as MaintenanceStatus)
      ? (searchParams.status as MaintenanceStatus)
      : undefined;

  const priorityFilter =
    searchParams.priority &&
    MAINTENANCE_PRIORITIES.includes(searchParams.priority as MaintenancePriority)
      ? (searchParams.priority as MaintenancePriority)
      : undefined;

  const requests = await getMaintenanceRequests(supabase, propertyId, {
    status: statusFilter,
    priority: priorityFilter,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface dark:text-neutral-100">
          Maintenance Requests
        </h1>
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/maintenance/new`}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-primary/90"
        >
          New Request
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="rounded-md border border-[--color-outline-variant] px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value="">All Statuses</option>
          {MAINTENANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          name="priority"
          defaultValue={priorityFilter ?? ""}
          className="rounded-md border border-[--color-outline-variant] px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value="">All Priorities</option>
          {MAINTENANCE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-[--color-outline-variant] px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-[--color-surface-container-low] dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Filter
        </button>
      </form>

      <MaintenanceList requests={requests} />
    </div>
  );
}

export default function MaintenanceListPage(
  props: Readonly<{
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; priority?: string }>;
  }>,
) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent {...props} />
    </Suspense>
  );
}
