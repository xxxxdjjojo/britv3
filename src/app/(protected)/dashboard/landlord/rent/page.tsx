import { createClient } from "@/lib/supabase/server";
import { getRentCollection } from "@/services/landlord/financial-service";
import { RentCollectionClient } from "./RentCollectionClient";
import type { RentCollectionGroup } from "@/types/landlord";

/**
 * 9.10 Rent Collection Overview — Server Component.
 * Fetches initial rent data server-side, passes to client wrapper.
 * Client wrapper uses React Query with initialData for optimistic updates.
 */
export default async function RentPage() {
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
