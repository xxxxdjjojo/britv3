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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Rent Collection
        </h1>
        <p className="text-muted-foreground">
          Track and manage rent payments across your portfolio
        </p>
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
