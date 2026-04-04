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
      <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100/60 dark:border-neutral-700/60 bg-muted/40">
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Entity Type
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Entity ID
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reason
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reported At
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-neutral-100/60 dark:border-neutral-700/60 hover:bg-muted/30 transition-colors last:border-0">
                <td className="px-4 py-3 font-body text-sm font-medium text-foreground capitalize">
                  {report.entity_type ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                  {report.entity_id ? `${report.entity_id.slice(0, 8)}…` : "—"}
                </td>
                <td className="px-4 py-3 font-body text-sm text-foreground">
                  {report.reason ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={report.status ?? "open"} />
                </td>
                <td className="px-4 py-3 font-body text-sm text-neutral-500">
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
                      className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 font-body text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                      onClick={() => setModal({ type: "dismiss", reportId: report.id })}
                      disabled={isPending}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border border-error/20 dark:border-error/30 font-body text-xs font-medium text-error hover:bg-error-light dark:text-error dark:hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                      onClick={() => setModal({ type: "remove", reportId: report.id })}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border border-warning/20 dark:border-warning/30 font-body text-xs font-medium text-warning hover:bg-warning-light dark:text-warning dark:hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
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
