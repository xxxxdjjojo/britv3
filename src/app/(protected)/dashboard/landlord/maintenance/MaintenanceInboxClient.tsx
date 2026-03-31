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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Maintenance Management
          </p>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Inbox
            </h1>
            <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-sm font-bold text-brand-primary">
              {props.initialData.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Oversee requests, manage contractors, and maintain property value
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/dashboard/landlord/maintenance/new?priority=emergency"
            className="inline-flex items-center gap-2 rounded-lg bg-warning px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-warning/90 transition-colors"
          >
            <AlertTriangle className="size-4" />
            Report Emergency
          </Link>
          <Link
            href="/dashboard/landlord/maintenance/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-light transition-colors"
          >
            <Plus className="size-4" />
            New Request
          </Link>
        </div>
      </div>

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error-light p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error" />
          <div>
            <p className="text-sm font-semibold text-error">
              {urgentCount} emergency{" "}
              {urgentCount === 1 ? "request" : "requests"} need immediate
              action
            </p>
            <p className="mt-0.5 text-xs text-error/80">
              {inProgressCount} in progress across the portfolio
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Priority filter */}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
          {(["all", "emergency", "high", "medium", "low"] as const).map(
            (p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                aria-label={`Filter by priority: ${p === "all" ? "all priorities" : p}`}
                aria-pressed={priorityFilter === p}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p === "all"
                  ? "All Priorities"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ),
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
          {(["all", "new", "in_progress", "resolved"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              aria-label={`Filter by status: ${s === "all" ? "all statuses" : s.replace("_", " ")}`}
              aria-pressed={statusFilter === s}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-primary/10">
            <Wrench className="size-8 text-brand-primary" />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            No requests found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
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
              className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md"
            >
              {/* Category icon */}
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                  request.priority === "emergency"
                    ? "bg-error-light text-error"
                    : request.priority === "high"
                      ? "bg-warning-light text-warning"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <CategoryIcon category={request.title} className="size-6" />
              </div>

              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground transition-colors group-hover:text-brand-primary">
                    {request.title}
                  </h3>
                  <MaintenancePriorityBadge priority={request.priority} />
                  <MaintenanceStatusBadge status={request.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {request.description.slice(0, 80)}
                  {request.description.length > 80 ? "…" : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{request.property_address}</span>
                  {request.tenant_name && (
                    <>
                      <span className="text-border">•</span>
                      <span>{request.tenant_name}</span>
                    </>
                  )}
                  <span className="text-border">•</span>
                  <span>
                    {formatDistanceToNow(new Date(request.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {request.assigned_provider_name ? (
                    <>
                      <span className="text-border">•</span>
                      <span className="text-success font-medium">
                        {request.assigned_provider_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-border">•</span>
                      <span className="text-warning font-medium">
                        Unassigned
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-brand-primary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
