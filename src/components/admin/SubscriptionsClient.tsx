"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { useAdminAction } from "@/hooks/useAdminAction";
import { CreditCard, XCircle } from "lucide-react";
import type { AdminSubscription } from "@/services/admin/subscription-service";

type Props = Readonly<{
  subscriptions: AdminSubscription[];
}>;

const CANCEL_REASONS = [
  "User request",
  "Non-payment",
  "Policy violation",
  "Fraud",
  "Other",
];

export function SubscriptionsClient({ subscriptions }: Props) {
  const { execute, isPending } = useAdminAction();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleCancel(reason: string) {
    if (!confirmId) return;
    await execute(`/api/admin/subscriptions/${confirmId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setConfirmId(null);
  }

  if (subscriptions.length === 0) {
    return (
      <AdminEmptyState
        icon={CreditCard}
        title="No subscriptions"
        description="No active subscriptions found."
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">
                User ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">
                Plan
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">
                Created
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                  {sub.user_id.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 font-medium text-neutral-800 capitalize">
                  {sub.plan}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={sub.status} />
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(sub.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {sub.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-error hover:text-error/80 hover:border-error/30"
                      onClick={() => setConfirmId(sub.id)}
                      disabled={isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminConfirmModal
        open={!!confirmId}
        title="Cancel Subscription"
        description="This will cancel the subscription immediately. This action cannot be undone."
        reasons={CANCEL_REASONS}
        onConfirm={(reason) => handleCancel(reason)}
        onCancel={() => setConfirmId(null)}
        confirmLabel="Cancel Subscription"
        isLoading={isPending}
      />
    </>
  );
}
