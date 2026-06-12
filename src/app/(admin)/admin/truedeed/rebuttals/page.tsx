import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RebuttalQueueClient } from "@/components/admin/truedeed/RebuttalQueueClient";
import { getPendingRebuttals } from "@/lib/truedeed/queries";
import type { PendingRebuttal } from "@/types/truedeed";

export const metadata = {
  title: "Truedeed Rebuttals - Admin - Britestate",
};

export default async function AdminTruedeedRebuttalsPage() {
  let items: PendingRebuttal[] = [];

  try {
    items = await getPendingRebuttals();
  } catch (err) {
    console.warn("[admin/truedeed/rebuttals] failed to load queue", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="Rebuttals"
        description="Pending Truedeed introduction disputes awaiting a decision."
      />

      <RebuttalQueueClient items={items} />
    </div>
  );
}
