"use client";

import type { AuditLogEntry } from "@/services/admin/audit-service";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { useState, useTransition } from "react";

type Props = Readonly<{
  entries: AuditLogEntry[];
  actionFilter: string;
  adminIdFilter: string;
  cursor?: string;
  hasMore: boolean;
  limit: number;
}>;

function exportToCsvLocal(entries: AuditLogEntry[]) {
  const headers = ["id", "admin_id", "action", "target_type", "target_id", "ip_address", "created_at"];
  const rows = entries.map((e) => [
    e.id,
    e.admin_id,
    e.action,
    e.target_type,
    e.target_id,
    e.ip_address ?? "",
    e.created_at,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditLogClient({
  entries,
  actionFilter,
  adminIdFilter,
  hasMore,
  limit,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [action, setAction] = useState(actionFilter);
  const [adminId, setAdminId] = useState(adminIdFilter);
  const [loadingMore, startLoadMore] = useTransition();

  function applyFilters() {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (adminId) params.set("adminId", adminId);
    router.push(`?${params.toString()}`);
  }

  function clearFilters() {
    setAction("");
    setAdminId("");
    router.push("?");
  }

  function loadMore() {
    if (!entries.length) return;
    const oldestEntry = entries[entries.length - 1];
    startLoadMore(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", oldestEntry.created_at);
      router.push(`?${params.toString()}`);
    });
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (adminIdFilter) params.set("adminId", adminIdFilter);

    try {
      const res = await fetch(`/api/admin/audit-log/export?${params.toString()}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Export failed");
      const { csv } = (await res.json()) as { csv: string; count: number };

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      exportToCsvLocal(entries);
    }
  }

  const hasFilters = !!actionFilter || !!adminIdFilter;

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Filter by action (e.g. user.suspend)"
          className="h-8 text-sm max-w-xs"
        />
        <Input
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          placeholder="Filter by admin ID"
          className="h-8 text-sm max-w-xs"
        />
        <Button size="sm" variant="outline" onClick={applyFilters} className="h-8">
          Apply
        </Button>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters} className="h-8">
            Clear
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 ml-auto flex items-center gap-1.5"
          onClick={handleExport}
          disabled={entries.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-muted">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Action
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Target
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Admin ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                IP
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-muted transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-neutral-800">
                  {entry.action}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  <span className="text-neutral-700">{entry.target_type}</span>
                  {" / "}
                  <span className="font-mono">{entry.target_id.slice(0, 8)}…</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                  {entry.admin_id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">
                  {entry.ip_address ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-400">
            No entries match the current filters.
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : `Load more (${limit} at a time)`}
          </Button>
        </div>
      )}
    </div>
  );
}
