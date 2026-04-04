"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MaintenanceStatus } from "@/types/landlord";

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function StatusUpdateForm(
  props: Readonly<{
    requestId: string;
    currentStatus: MaintenanceStatus;
    validTransitions: MaintenanceStatus[];
  }>,
) {
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | "">(
    "",
  );
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const showResolutionField = selectedStatus === "resolved";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedStatus) {
      toast.error("Select a status");
      return;
    }

    if (showResolutionField && !resolutionNotes.trim()) {
      toast.error("Resolution notes are required");
      return;
    }

    setIsUpdating(true);

    try {
      const body: Record<string, string> = { status: selectedStatus };
      if (showResolutionField) {
        body.resolution_notes = resolutionNotes.trim();
      }

      const res = await fetch(`/api/maintenance/${props.requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update status");
      }

      toast.success(`Status updated to ${STATUS_LABELS[selectedStatus]}`);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        Update Status
      </h3>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {props.validTransitions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedStatus === status
                  ? "border-brand-primary bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/10 dark:text-brand-primary"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {showResolutionField && (
          <div>
            <label
              htmlFor="resolution-notes"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Resolution Notes *
            </label>
            <textarea
              id="resolution-notes"
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              placeholder="Describe how the issue was resolved..."
            />
          </div>
        )}

        {selectedStatus && (
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating
              ? "Updating..."
              : `Move to ${STATUS_LABELS[selectedStatus]}`}
          </button>
        )}
      </form>
    </div>
  );
}
