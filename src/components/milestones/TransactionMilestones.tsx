"use client";

/**
 * TransactionMilestones -- 8-step UK property pipeline view.
 * Fetches and displays transaction milestones with inline editing.
 *
 * Layout: horizontal stepper rail across the top, then stacked milestone
 * detail cards below. Matches the Stitch Transaction Progress Tracker reference.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Circle, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { MilestoneStatus } from "@/types/milestones";
import type { MilestoneStep } from "./MilestoneTracker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionMilestonesProps = Readonly<{
  transactionId: string;
  readOnly?: boolean;
}>;

type ApiMilestone = {
  id: string;
  milestone_key: string;
  status: MilestoneStatus;
  notes: string | null;
  completed_date: string | null;
  label: string;
  description: string;
  order: number;
};

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    railColor: "bg-success",
    railRing: "ring-success/20",
    textColor: "text-success",
    cardBorder: "border-l-success",
    badgeClass: "bg-success/10 text-success",
    label: "Completed",
  },
  in_progress: {
    icon: CircleDot,
    railColor: "bg-warning",
    railRing: "ring-warning/20",
    textColor: "text-warning",
    cardBorder: "border-l-warning",
    badgeClass: "bg-warning/10 text-warning",
    label: "In Progress",
  },
  not_started: {
    icon: Circle,
    railColor: "bg-neutral-300 dark:bg-neutral-600",
    railRing: "ring-neutral-200/20",
    textColor: "text-neutral-400 dark:text-neutral-500",
    cardBorder: "border-l-neutral-200 dark:border-l-neutral-700",
    badgeClass: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    label: "Not Started",
  },
} as const;

// ---------------------------------------------------------------------------
// Horizontal stepper rail
// ---------------------------------------------------------------------------

function StepperRail({ milestones }: { milestones: MilestoneStep[] }) {
  return (
    <div className="relative flex items-start gap-0">
      {milestones.map((milestone, index) => {
        const config = STATUS_CONFIG[milestone.status];
        const Icon = config.icon;
        const isLast = index === milestones.length - 1;

        return (
          <div key={milestone.id} className="relative flex flex-1 flex-col items-center">
            {/* Connector line */}
            {!isLast && (
              <div
                className={`absolute top-4 left-1/2 h-0.5 w-full ${config.railColor}`}
                aria-hidden="true"
              />
            )}

            {/* Step icon */}
            <div
              className={`relative z-10 flex size-8 items-center justify-center rounded-full bg-white ring-4 dark:bg-neutral-900 ${config.railRing}`}
            >
              <Icon className={`size-5 ${config.textColor}`} />
            </div>

            {/* Step label */}
            <p
              className={`mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight px-1 ${config.textColor}`}
            >
              {milestone.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single milestone detail card
// ---------------------------------------------------------------------------

type MilestoneCardProps = Readonly<{
  milestone: MilestoneStep;
  onUpdate?: (milestoneId: string, data: { status: MilestoneStatus; notes?: string }) => void;
  readOnly: boolean;
}>;

function MilestoneCard({ milestone, onUpdate, readOnly }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editStatus, setEditStatus] = useState<MilestoneStatus>(milestone.status);
  const [editNotes, setEditNotes] = useState(milestone.notes ?? "");
  const config = STATUS_CONFIG[milestone.status];

  function handleToggle() {
    if (readOnly || !onUpdate) return;
    if (!expanded) {
      setEditStatus(milestone.status);
      setEditNotes(milestone.notes ?? "");
    }
    setExpanded((prev) => !prev);
  }

  function handleSave() {
    if (!onUpdate) return;
    onUpdate(milestone.id, { status: editStatus, notes: editNotes || undefined });
    setExpanded(false);
  }

  return (
    <div
      className={`rounded-xl border border-border border-l-4 bg-white dark:bg-neutral-900 ${config.cardBorder} shadow-sm`}
    >
      <div className="px-5 py-4">
        {/* Header row: status badge + date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.1em] ${config.textColor}`}
            >
              {config.label}
            </span>
            {milestone.status === "completed" && milestone.completedDate && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold text-neutral-500 border-neutral-200 px-2 py-0.5"
              >
                {milestone.completedDate}
              </Badge>
            )}
          </div>

          {/* Edit trigger — only when editable */}
          {!readOnly && onUpdate && (
            <button
              type="button"
              onClick={handleToggle}
              className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors shrink-0"
              aria-expanded={expanded}
            >
              {expanded ? "Cancel" : "Edit"}
            </button>
          )}
        </div>

        {/* Milestone label */}
        <h3 className="mt-1.5 font-heading text-sm font-bold tracking-tight text-brand-primary-dark">
          {milestone.label}
        </h3>

        {/* Description */}
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {milestone.description}
        </p>

        {/* Notes (read view) */}
        {milestone.notes && !expanded && (
          <p className="mt-2 text-xs text-neutral-500 italic">{milestone.notes}</p>
        )}

        {/* Inline edit panel */}
        {expanded && (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface/60 p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">
                Status
              </label>
              <Select
                value={editStatus}
                onValueChange={(v) => setEditStatus(v as MilestoneStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">
                Notes
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes..."
                className="min-h-16 text-xs"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setExpanded(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TransactionMilestones({
  transactionId,
  readOnly = false,
}: TransactionMilestonesProps) {
  const [milestones, setMilestones] = useState<MilestoneStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/milestones/transaction?id=${encodeURIComponent(transactionId)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch milestones");

      const json = await res.json();
      const steps: MilestoneStep[] = (json.milestones ?? []).map(
        (m: ApiMilestone) => ({
          id: m.id,
          key: m.milestone_key,
          label: m.label,
          description: m.description,
          status: m.status,
          notes: m.notes,
          completedDate: m.completed_date,
        }),
      );
      setMilestones(steps);
    } catch {
      toast.error("Failed to load transaction milestones");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    void fetchMilestones();
  }, [fetchMilestones]);

  async function handleUpdate(
    milestoneId: string,
    data: { status: MilestoneStatus; notes?: string },
  ) {
    try {
      const res = await fetch(
        `/api/milestones/transaction?id=${encodeURIComponent(milestoneId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Update failed");
      }

      toast.success("Milestone updated");
      await fetchMilestones();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update milestone",
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stepper skeleton */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        {/* Card skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Horizontal stepper rail */}
      <div className="rounded-xl border border-border bg-white dark:bg-neutral-900 p-5 shadow-sm overflow-x-auto">
        <h2 className="mb-4 font-heading text-lg font-bold text-brand-primary-dark">
          Property Transaction Progress
        </h2>
        <StepperRail milestones={milestones} />

        {/* Progress bar + count */}
        <div className="mt-5 flex items-center gap-3">
          <Progress value={percentage} className="flex-1" />
          <span className="shrink-0 text-sm font-semibold text-neutral-500">
            {completedCount}/{total} completed
          </span>
        </div>
      </div>

      {/* Milestone detail cards */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Milestone Details
        </p>
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onUpdate={readOnly ? undefined : handleUpdate}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
