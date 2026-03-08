"use client";

/**
 * JobMilestones -- 5-step service job pipeline view.
 * Fetches and displays service job milestones with inline editing.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MilestoneTracker } from "./MilestoneTracker";
import type { MilestoneStep } from "./MilestoneTracker";
import type { MilestoneStatus } from "@/types/milestones";
import { Skeleton } from "@/components/ui/skeleton";

type JobMilestonesProps = Readonly<{
  bookingId: string;
  readOnly?: boolean;
}>;

type ApiMilestone = {
  id: string;
  milestone_key: string;
  status: MilestoneStatus;
  notes: string | null;
  label: string;
  description: string;
  order: number;
};

export function JobMilestones({
  bookingId,
  readOnly = false,
}: JobMilestonesProps) {
  const [milestones, setMilestones] = useState<MilestoneStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/milestones/job?id=${encodeURIComponent(bookingId)}`,
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
          completedDate: null, // Service job milestones don't track completed_date
        }),
      );
      setMilestones(steps);
    } catch {
      toast.error("Failed to load job milestones");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void fetchMilestones();
  }, [fetchMilestones]);

  async function handleUpdate(
    milestoneId: string,
    data: { status: MilestoneStatus; notes?: string },
  ) {
    try {
      const res = await fetch(
        `/api/milestones/job?id=${encodeURIComponent(milestoneId)}`,
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <MilestoneTracker
      title="Service Job Progress"
      milestones={milestones}
      onUpdate={readOnly ? undefined : handleUpdate}
      readOnly={readOnly}
    />
  );
}
