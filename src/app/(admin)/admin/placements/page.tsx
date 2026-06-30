import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPlacementsClient } from "@/components/admin/AdminPlacementsClient";
import { getActiveRevenuePence, listAllPlacements } from "@/services/placements/placement-admin-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sponsored Placements — Admin" };

export default async function AdminPlacementsPage() {
  const supabase = await createClient();

  let placements: Awaited<ReturnType<typeof listAllPlacements>> = [];
  let revenuePence = 0;
  try {
    [placements, revenuePence] = await Promise.all([
      listAllPlacements(supabase),
      getActiveRevenuePence(supabase),
    ]);
  } catch {
    placements = [];
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Growth"
        title="Sponsored Placements"
        description="Review boosted ads, prevent over-selling, feature traders, and track advertising revenue."
      />
      <AdminPlacementsClient initialPlacements={placements} revenuePence={revenuePence} />
    </div>
  );
}
