"use client";

import { useTransition } from "react";
import type { GdprRequest } from "@/services/admin/gdpr-service";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = Readonly<{
  requests: GdprRequest[];
  allRequests: GdprRequest[];
  statusFilter: string;
}>;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "failed", label: "Failed" },
];

function FulfilButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleFulfil() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/gdpr/${requestId}/fulfil`, {
          method: "POST",
        });
        if (res.status === 409) {
          toast.info("Request already fulfilled or in progress");
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Failed to fulfil request");
        }
        toast.success("GDPR request accepted — processing started");
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to fulfil request",
        );
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleFulfil}
      disabled={pending}
      className="text-xs"
    >
      {pending ? "Processing…" : "Fulfil"}
    </Button>
  );
}

function StatusFilter({
  current,
  counts,
}: {
  current: string;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-44 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
            {opt.value !== "all" && counts[opt.value]
              ? ` (${counts[opt.value]})`
              : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GdprQueueClient({ requests, allRequests, statusFilter }: Props) {
  const counts: Record<string, number> = {};
  for (const r of allRequests) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-neutral-500">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </span>
        <StatusFilter current={statusFilter} counts={counts} />
      </div>

      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Request ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Submitted
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Fulfilled At
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                  {req.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 capitalize text-neutral-700">
                  {req.request_type.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(req.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {req.fulfilled_at
                    ? new Date(req.fulfilled_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {req.status === "pending" && (
                    <FulfilButton requestId={req.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-400">
            No requests match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
