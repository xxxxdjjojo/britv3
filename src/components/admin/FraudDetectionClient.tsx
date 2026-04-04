"use client";

import { useState, useTransition } from "react";
import type { FraudSignal } from "@/app/(admin)/admin/fraud/page";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = Readonly<{ signals: FraudSignal[] }>;

function RiskBadge({ score }: { score: number }) {
  const className =
    score >= 80
      ? "bg-error-light text-error"
      : score >= 50
        ? "bg-warning-light text-warning"
        : "bg-neutral-100 text-neutral-600";
  const label = score >= 80 ? "High" : score >= 50 ? "Medium" : "Low";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label} ({score})
    </span>
  );
}

export function FraudDetectionClient({ signals }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [suspending, startSuspend] = useTransition();
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  function toggleSelect(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === signals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(signals.map((s) => s.userId)));
    }
  }

  function promptBulkSuspend() {
    if (selected.size === 0) return;
    setShowBulkConfirm(true);
  }

  function executeBulkSuspend() {
    const ids = [...selected];
    setShowBulkConfirm(false);
    startSuspend(async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/admin/users/${id}/suspend`, { method: "POST" }),
          ),
        );
        const succeeded = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
        const failed = ids.length - succeeded;
        if (succeeded > 0) {
          toast.success(`${succeeded} user${succeeded !== 1 ? "s" : ""} suspended`);
        }
        if (failed > 0) {
          toast.error(`${failed} suspension${failed !== 1 ? "s" : ""} failed`);
        }
        setSelected(new Set());
        router.refresh();
      } catch {
        toast.error("Bulk suspend failed");
      }
    });
  }

  return (
    <div>
      {/* Bulk actions bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-neutral-500">
          {signals.length} flagged user{signals.length !== 1 ? "s" : ""}
          {selected.size > 0 && (
            <span className="ml-2 text-neutral-700 font-medium">
              ({selected.size} selected)
            </span>
          )}
        </span>
        <Button
          size="sm"
          variant="destructive"
          onClick={promptBulkSuspend}
          disabled={selected.size === 0 || suspending}
          className="text-xs"
        >
          {suspending
            ? "Suspending…"
            : `Suspend selected (${selected.size})`}
        </Button>
      </div>

      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Suspension</DialogTitle>
            <DialogDescription>
              You are about to suspend {selected.size} user{selected.size !== 1 ? "s" : ""}.
              Their sessions will be immediately invalidated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeBulkSuspend}>
              Suspend {selected.size} user{selected.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <Checkbox
                  checked={selected.size === signals.length && signals.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Reports
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Risk Score
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {signals.map((signal) => (
              <tr
                key={signal.userId}
                className={cn(
                  "hover:bg-neutral-50 transition-colors",
                  selected.has(signal.userId) && "bg-brand-accent-light",
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selected.has(signal.userId)}
                    onCheckedChange={() => toggleSelect(signal.userId)}
                    disabled={!!signal.isSuspended}
                    aria-label={`Select ${signal.fullName ?? signal.userId}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">
                    {signal.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-neutral-400">{signal.email ?? "—"}</p>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-600 text-xs">
                  {signal.role ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-700 font-mono text-sm">
                  {signal.reportCount}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge score={signal.riskScore} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={signal.isSuspended ? "suspended" : "active"}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {signal.createdAt
                    ? new Date(signal.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
