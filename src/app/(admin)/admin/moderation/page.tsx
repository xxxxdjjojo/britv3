import { createClient } from "@/lib/supabase/server";
import { flagListing } from "@/services/moderation-service";
import type { FlaggedListing } from "@/components/admin/ModerationQueue";
import { ModerationQueueClient } from "@/components/admin/ModerationQueueClient";

export default async function AdminModerationPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id, title, address, price, property_type, description, status, created_at")
    .eq("status", "flagged")
    .order("created_at", { ascending: true });

  const flaggedListings: FlaggedListing[] = (data ?? []).map((row) => {
    const { flags } = flagListing({
      title: row.title ?? "",
      description: row.description ?? "",
      price: row.price ?? 0,
      property_type: row.property_type ?? "house",
      address: row.address ?? "",
    });

    return {
      id: row.id as string,
      title: (row.title as string | null) ?? "Untitled listing",
      address: row.address as string | null,
      flags,
      created_at: row.created_at as string | null,
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Listing Moderation</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review and action flagged listings. {flaggedListings.length} item
          {flaggedListings.length !== 1 ? "s" : ""} awaiting review.
        </p>
      </div>

      <ModerationQueueClient listings={flaggedListings} />
    </div>
  );
}
