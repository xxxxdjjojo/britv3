"use client";

/**
 * MilestoneTracker -- generic vertical stepper with connected line between steps.
 * Renders milestone progress with optional inline editing for status/notes.
 */

import { useState } from "react";
import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/types/milestones";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MilestoneStep = Readonly<{
  id: string;
  key: string;
  label: string;
  description: string;
  status: MilestoneStatus;
  notes: string | null;
  completedDate: string | null;
}>;

type MilestoneTrackerProps = Readonly<{
  title: string;
  milestones: MilestoneStep[];
  onUpdate?: (milestoneId: string, data: { status: MilestoneStatus; notes?: string }) => void;
  readOnly?: boolean;
}>;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: MilestoneStatus }) {
  if (status === "completed") {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-white">
        <Check className="size-4" />
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary ring-2 ring-brand-primary">
        <Circle className="size-3 fill-current" />
      </div>
    );
  }
  // not_started / pending
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
      <Clock className="size-4" />
    </div>
  );
}

function statusLabel(status: MilestoneStatus): string {
  switch (status) {
    case "completed": return "Completed";
    case "in_progress": return "In Progress";
    default: return "Not Started";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MilestoneTracker({
  title,
  milestones,
  onUpdate,
  readOnly = false,
}: MilestoneTrackerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<MilestoneStatus>("not_started");
  const [editNotes, setEditNotes] = useState("");

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  function handleExpand(milestone: MilestoneStep) {
    if (readOnly || !onUpdate) return;
    if (expandedId === milestone.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(milestone.id);
    setEditStatus(milestone.status);
    setEditNotes(milestone.notes ?? "");
  }

  function handleSave(milestoneId: string) {
    if (!onUpdate) return;
    onUpdate(milestoneId, { status: editStatus, notes: editNotes || undefined });
    setExpandedId(null);
  }

  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 overflow-hidden">
      {/* Header */}
      <div className="border-b border-neutral-100/60 dark:border-neutral-700/60 px-6 py-4">
        <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
        <div className="mt-2 flex items-center gap-3">
          {/* Progress bar */}
          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="font-body text-xs text-neutral-500 whitespace-nowrap">
            {completedCount}/{total} completed
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-4">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1;
          const isExpanded = expandedId === milestone.id;
          const canEdit = !readOnly && !!onUpdate;

          return (
            <div key={milestone.id} className="flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(canEdit && "cursor-pointer")}
                  onClick={() => handleExpand(milestone)}
                >
                  <StatusDot status={milestone.status} />
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 my-1",
                      milestone.status === "completed"
                        ? "bg-brand-primary"
                        : "bg-neutral-200 dark:bg-neutral-700",
                    )}
                  />
                )}
              </div>

              {/* Content column */}
              <div className={cn("flex-1", isLast ? "pb-0" : "pb-6")}>
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(canEdit && "cursor-pointer")}
                    onClick={() => handleExpand(milestone)}
                  >
                    <p className="font-body text-sm font-medium text-foreground">
                      {milestone.label}
                    </p>
                    <p className="font-body text-xs text-neutral-500 line-clamp-1">
                      {milestone.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-body text-xs font-medium",
                      milestone.status === "completed" &&
                        "bg-brand-primary/10 text-brand-primary",
                      milestone.status === "in_progress" &&
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                      milestone.status === "not_started" &&
                        "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
                    )}
                  >
                    {statusLabel(milestone.status)}
                  </span>
                </div>

                {milestone.status === "completed" && milestone.completedDate && (
                  <p className="mt-1 font-body text-xs text-brand-primary">
                    Completed {milestone.completedDate}
                  </p>
                )}

                {milestone.notes && !isExpanded && (
                  <div className="mt-2 rounded-lg bg-muted/50 p-3 font-body text-xs text-neutral-600 dark:text-neutral-400">
                    {milestone.notes}
                  </div>
                )}

                {/* Inline edit panel */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-muted/50 p-3">
                    <div>
                      <label className="font-body text-xs font-medium text-foreground mb-1 block">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as MilestoneStatus)}
                        className="w-full rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-1.5 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-body text-xs font-medium text-foreground mb-1 block">
                        Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes..."
                        maxLength={500}
                        rows={3}
                        className="w-full rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card px-3 py-1.5 font-body text-xs font-medium text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(milestone.id)}
                        className="rounded-lg bg-brand-primary px-3 py-1.5 font-body text-xs font-medium text-white hover:bg-brand-primary/90 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
