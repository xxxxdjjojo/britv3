import { createClient } from "@/lib/supabase/server";
import { getListingQueue } from "@/services/admin/listing-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListingModerationTabs } from "@/components/admin/ListingModerationTabs";

export default async function AdminModerationPage() {
  const supabase = await createClient();

  const [pendingListings, allListings, flaggedListings] = await Promise.all([
    getListingQueue(supabase, "pending"),
    getListingQueue(supabase),
    getListingQueue(supabase, "flagged"),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Listing Moderation"
        description="Review, approve, reject, and flag property listings."
      />

      <ListingModerationTabs
        pendingListings={pendingListings}
        allListings={allListings}
        flaggedListings={flaggedListings}
      />
    </div>
  );
}
