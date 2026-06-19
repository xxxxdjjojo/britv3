import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DisputeQueueClient } from "@/components/admin/truedeed/DisputeQueueClient";
import { DisputeMetricsCard } from "@/components/admin/truedeed/DisputeMetricsCard";
import {
  getOpenDisputes,
  type OpenInvoiceDispute,
} from "@/lib/truedeed/queries";
import {
  getDisputeMetrics,
  type DisputeMetrics,
} from "@/services/truedeed/dispute-metrics-service";

export const metadata = {
  title: "Truedeed Disputes - Admin - TrueDeed",
};

// Live moderation state — never serve a cached render.
export const dynamic = "force-dynamic";

export default async function AdminTruedeedDisputesPage() {
  let items: OpenInvoiceDispute[] = [];
  let metrics: DisputeMetrics | null = null;

  try {
    items = await getOpenDisputes();
  } catch (err) {
    console.warn("[admin/truedeed/disputes] failed to load queue", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }

  try {
    metrics = await getDisputeMetrics();
  } catch (err) {
    console.warn("[admin/truedeed/disputes] failed to load metrics", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Disputes"
        description="Open invoice disputes awaiting a D1–D5 decision. Concede cancels the invoice; reject resumes the dunning clock where it stopped."
      />

      <DisputeMetricsCard metrics={metrics} />

      <DisputeQueueClient items={items} />
    </div>
  );
}
