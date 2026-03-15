"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminAction } from "@/hooks/useAdminAction";
import { toast } from "sonner";

type Report = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
  reporter_id?: string | null;
};

type ModalState =
  | { type: "dismiss"; reportId: string }
  | { type: "remove"; reportId: string }
  | { type: "warn"; reportId: string }
  | null;

type Props = Readonly<{
  reports: Report[];
}>;

const RESOLVE_REASONS = [
  "Spam",
  "Abusive content",
  "Illegal content",
  "Misinformation",
  "Other",
];

export function ReportedContentClient({ reports }: Props) {
  const { execute, isPending } = useAdminAction();
  const [modal, setModal] = useState<ModalState>(null);

  async function handleDismiss(_reason: string) {
    if (!modal || modal.type !== "dismiss") return;
    const ok = await execute("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: modal.reportId, resolution: "dismissed" }),
    });
    if (ok) {
      toast.success("Report dismissed");
      setModal(null);
    }
  }

  async function handleRemove(_reason: string) {
    if (!modal || modal.type !== "remove") return;
    const ok = await execute("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: modal.reportId, resolution: "resolved" }),
    });
    if (ok) {
      toast.success("Content removed");
      setModal(null);
    }
  }

  async function handleWarn(_reason: string) {
    if (!modal || modal.type !== "warn") return;
    const ok = await execute("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: modal.reportId, resolution: "resolved" }),
    });
    if (ok) {
      toast.success("Warning issued and report resolved");
      setModal(null);
    }
  }

  function getConfirmHandler(type: string) {
    if (type === "dismiss") return handleDismiss;
    if (type === "remove") return handleRemove;
    return handleWarn;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Entity Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Entity ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Reason
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Reported At
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-neutral-900 capitalize">
                  {report.entity_type ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500 font-mono">
                  {report.entity_id ? `${report.entity_id.slice(0, 8)}…` : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700">
                  {report.reason ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={report.status ?? "open"} />
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {report.created_at
                    ? new Date(report.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-neutral-700 text-xs"
                      onClick={() => setModal({ type: "dismiss", reportId: report.id })}
                      disabled={isPending}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
                      onClick={() => setModal({ type: "remove", reportId: report.id })}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs"
                      onClick={() => setModal({ type: "warn", reportId: report.id })}
                      disabled={isPending}
                    >
                      Warn
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminConfirmModal
        open={modal?.type === "dismiss"}
        title="Dismiss Report"
        description="This report will be dismissed. No action will be taken on the content."
        reasons={RESOLVE_REASONS}
        confirmLabel="Dismiss Report"
        isLoading={isPending}
        onConfirm={getConfirmHandler(modal?.type ?? "")}
        onCancel={() => setModal(null)}
      />

      <AdminConfirmModal
        open={modal?.type === "remove"}
        title="Remove Content"
        description="The reported content will be removed from the platform."
        reasons={RESOLVE_REASONS}
        confirmLabel="Remove Content"
        isLoading={isPending}
        onConfirm={getConfirmHandler(modal?.type ?? "")}
        onCancel={() => setModal(null)}
      />

      <AdminConfirmModal
        open={modal?.type === "warn"}
        title="Warn User"
        description="A warning will be issued to the content owner and the report resolved."
        reasons={RESOLVE_REASONS}
        confirmLabel="Issue Warning"
        isLoading={isPending}
        onConfirm={getConfirmHandler(modal?.type ?? "")}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
