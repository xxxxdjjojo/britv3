"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Wrench,
  Zap,
  Thermometer,
  Droplets,
  Plus,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import type { MaintenanceRequestWithProperty } from "@/services/landlord/maintenance-service";
import type { MaintenanceStatus, MaintenancePriority } from "@/types/landlord";
import { MaintenancePriorityBadge } from "@/components/landlord/MaintenancePriorityBadge";
import { MaintenanceStatusBadge } from "@/components/landlord/MaintenanceStatusBadge";

// -- Category icon map --------------------------------------------------------

function CategoryIcon({
  category,
  className,
}: Readonly<{ category: string; className?: string }>) {
  switch (category?.toLowerCase()) {
    case "plumbing":
      return <Droplets className={className} />;
    case "electrical":
      return <Zap className={className} />;
    case "heating":
    case "hvac":
      return <Thermometer className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

// -- Priority order for sorting -----------------------------------------------

const PRIORITY_ORDER: Record<MaintenancePriority, number> = {
  emergency: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// -- Main component -----------------------------------------------------------

export function MaintenanceInboxClient(
  props: Readonly<{
    initialData: MaintenanceRequestWithProperty[];
  }>,
) {
  const [priorityFilter, setPriorityFilter] = useState<
    MaintenancePriority | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    return props.initialData
      .filter((r) => {
        if (priorityFilter !== "all" && r.priority !== priorityFilter)
          return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        return true;
      })
      .sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [props.initialData, priorityFilter, statusFilter]);

  const urgentCount = props.initialData.filter(
    (r) => r.priority === "emergency",
  ).length;
  const inProgressCount = props.initialData.filter(
    (r) => r.status === "in_progress",
  ).length;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Maintenance Requests
            </h1>
            <span className="rounded-full bg-[#1B4D3E]/10 px-2.5 py-0.5 text-sm font-bold text-[#1B4D3E] dark:bg-[#1B4D3E]/30 dark:text-emerald-300">
              {props.initialData.length}
            </span>
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage repairs and coordinate with verified professionals across your
            portfolio.
          </p>
        </div>
        <Link
          href="/dashboard/landlord/maintenance/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B4D3E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#1B4D3E]/20 hover:bg-[#1B4D3E]/90 transition-colors"
        >
          <Plus className="size-4" />
          New Request
        </Link>
      </div>

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              {urgentCount} emergency{" "}
              {urgentCount === 1 ? "request" : "requests"} need immediate action
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {inProgressCount} in progress across the portfolio
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Priority filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
          {(
            ["all", "emergency", "high", "medium", "low"] as const
          ).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                priorityFilter === p
                  ? "bg-[#1B4D3E] text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {p === "all"
                ? "All Priorities"
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
          {(
            ["all", "new", "in_progress", "resolved"] as const
          ).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#1B4D3E] text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {s === "all"
                ? "All Statuses"
                : s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#1B4D3E]/10">
            <Wrench className="size-8 text-[#1B4D3E]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No requests found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {props.initialData.length === 0
              ? "Your portfolio has no maintenance requests yet."
              : "No requests match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <Link
              key={request.id}
              href={`/dashboard/landlord/maintenance/${request.id}`}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Category icon */}
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                  request.priority === "emergency"
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : request.priority === "high"
                      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <CategoryIcon
                  category={request.title}
                  className="size-6"
                />
              </div>

              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-[#1B4D3E] transition-colors dark:text-white dark:group-hover:text-emerald-400">
                    {request.title}
                  </h3>
                  <MaintenancePriorityBadge priority={request.priority} />
                  <MaintenanceStatusBadge status={request.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                  {request.description.slice(0, 80)}
                  {request.description.length > 80 ? "…" : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{request.property_address}</span>
                  {request.tenant_name && (
                    <>
                      <span className="text-slate-200 dark:text-slate-700">
                        •
                      </span>
                      <span>{request.tenant_name}</span>
                    </>
                  )}
                  <span className="text-slate-200 dark:text-slate-700">•</span>
                  <span>
                    {formatDistanceToNow(new Date(request.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {request.assigned_provider_name ? (
                    <>
                      <span className="text-slate-200 dark:text-slate-700">
                        •
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        {request.assigned_provider_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-200 dark:text-slate-700">
                        •
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        Unassigned
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="size-5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-700 dark:group-hover:text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
