import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CandidateReviewQueueClient } from "@/components/admin/truedeed/CandidateReviewQueueClient";
import { listPendingCandidates } from "@/services/truedeed/candidate-review-service";
import type { CandidateReviewItem } from "@/types/truedeed";

export const metadata = {
  title: "Truedeed Invoice Candidates - Admin - Britestate",
};

// The queue is live moderation state — never serve a cached render. (The
// page itself reads no dynamic API, so without this Next caches the RSC
// output of the first request.)
export const dynamic = "force-dynamic";

export default async function AdminTruedeedInvoiceCandidatesPage() {
  let items: CandidateReviewItem[] = [];

  try {
    items = (await listPendingCandidates()) ?? [];
  } catch (err) {
    console.warn("[admin/truedeed/invoice-candidates] failed to load queue", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="Invoice candidates"
        description="Truedeed introduction-fee candidates awaiting an approve/reject decision."
      />

      <CandidateReviewQueueClient items={items} />
    </div>
  );
}
