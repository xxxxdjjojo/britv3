import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getRentCollection } from "@/services/landlord/financial-service";
import { RentCollectionClient } from "./RentCollectionClient";
import type { RentCollectionGroup } from "@/types/landlord";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 9.10 Rent Collection Overview — Server Component.
 * Fetches initial rent data server-side, passes to client wrapper.
 * Client wrapper uses React Query with initialData for optimistic updates.
 */

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  let rentGroups: RentCollectionGroup = { paid: [], partial: [], overdue: [] };

  try {
    rentGroups = await getRentCollection(supabase);
  } catch {
    // Silently fall back to empty data — client will retry via React Query
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Rent Collection Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay on top of your rental income
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          Export Report
        </button>
      </div>

      <RentCollectionClient initialData={rentGroups} />
    </div>
  );
}

export default function RentPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
