import { createClient } from "@/lib/supabase/server";
import { getListingQueue } from "@/services/admin/listing-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListingModerationTabs } from "@/components/admin/ListingModerationTabs";

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Math.max(0, parseInt(params.page, 10) || 0) : 0;
  const limit = 50;

  const supabase = await createClient();

  const [
    { listings: pendingListings },
    { listings: allListings },
    { listings: flaggedListings },
  ] = await Promise.all([
    getListingQueue(supabase, "pending", page, limit),
    getListingQueue(supabase, undefined, page, limit),
    getListingQueue(supabase, "flagged", page, limit),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Moderation"
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
