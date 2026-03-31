/**
 * JobTimeline — Server Component
 *
 * Vertical timeline showing booking status progression.
 * Steps: Enquiry → Quote Sent → Booking Confirmed → In Progress → Completed
 */

import type { JobTimelineEntry } from "@/services/provider/provider-job-service";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type TimelineStep = {
  key: string;
  label: string;
};

const STEPS: TimelineStep[] = [
  { key: "enquiry", label: "Enquiry" },
  { key: "quote_sent", label: "Quote Sent" },
  { key: "confirmed", label: "Booking Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

/** Map booking statuses to the highest completed step index (0-based). */
function completedStepIndex(status: string): number {
  switch (status) {
    case "active":
      return 1; // enquiry + quote sent treated as "active / confirmed"
    case "confirmed":
      return 2;
    case "in_progress":
      return 3;
    case "completed":
      return 4;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIcon({
  done,
  isLast,
}: Readonly<{ done: boolean; isLast: boolean }>) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Circle */}
      <div
        className={[
          "size-4 rounded-full border-2 flex-shrink-0 z-10",
          done
            ? "bg-brand-primary border-brand-primary"
            : "bg-white border-neutral-300",
        ].join(" ")}
      />
      {/* Connecting line */}
      {!isLast && (
        <div
          className={[
            "w-px flex-1 mt-0.5",
            done ? "bg-brand-primary" : "border-l-2 border-dashed border-neutral-300",
          ].join(" ")}
          style={{ minHeight: "2.5rem" }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function JobTimeline({
  status,
  timeline,
}: Readonly<{
  status: string;
  timeline: JobTimelineEntry[];
}>) {
  const doneIndex = completedStepIndex(status);

  // Build a map from label → timestamp for display
  const labelToTs: Record<string, string> = {};
  for (const entry of timeline) {
    labelToTs[entry.label] = entry.at;
  }

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= doneIndex;
        const isLast = i === STEPS.length - 1;
        const ts = timeline[i]?.at ?? null;

        return (
          <div key={step.key} className="flex gap-3">
            <StepIcon done={done} isLast={isLast} />
            <div className={["pb-6 pt-0.5 flex flex-col gap-0.5", isLast ? "pb-0" : ""].join(" ")}>
              <span
                className={[
                  "text-sm font-medium",
                  done ? "text-neutral-900" : "text-neutral-400",
                ].join(" ")}
              >
                {step.label}
              </span>
              {done && ts ? (
                <span className="text-xs text-neutral-500">
                  {new Date(ts).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ) : !done ? (
                <span className="text-xs text-neutral-400">Pending</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
