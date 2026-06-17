/**
 * JobTimeline — Server Component
 *
 * Vertical activity timeline showing booking status progression.
 * Steps: Enquiry → Quote Sent → Booking Confirmed → In Progress → Completed
 */

import type { JobTimelineEntry } from "@/services/provider/provider-job-service";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type TimelineStep = {
  key: string;
  label: string;
  initials: string;
};

const STEPS: TimelineStep[] = [
  { key: "enquiry", label: "Enquiry", initials: "EN" },
  { key: "quote_sent", label: "Quote Sent", initials: "QS" },
  { key: "confirmed", label: "Booking Confirmed", initials: "BC" },
  { key: "in_progress", label: "In Progress", initials: "IP" },
  { key: "completed", label: "Completed", initials: "CP" },
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

function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${diffDays} days ago`;
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

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= doneIndex;
        const isLast = i === STEPS.length - 1;
        const ts = timeline[i]?.at ?? null;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Left: avatar dot + connector line */}
            <div className="relative flex flex-col items-center">
              {/* Avatar circle */}
              <div
                className={[
                  "size-8 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold",
                  done
                    ? "bg-brand-primary text-white"
                    : "bg-surface border border-border text-neutral-400",
                ].join(" ")}
              >
                {done ? (
                  // Checkmark for completed steps
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    className="size-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.initials
                )}
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  className={[
                    "w-px flex-1 mt-0.5 mb-0.5",
                    done
                      ? "bg-brand-primary/30"
                      : "border-l border-dashed border-neutral-200",
                  ].join(" ")}
                  style={{ minHeight: "2rem" }}
                />
              )}
            </div>

            {/* Right: label + timestamp */}
            <div className={["pb-6 pt-1 flex flex-col gap-0.5", isLast ? "pb-0" : ""].join(" ")}>
              <span
                className={[
                  "text-sm font-semibold leading-tight",
                  done ? "text-neutral-900" : "text-neutral-400",
                ].join(" ")}
              >
                {step.label}
              </span>
              {done && ts ? (
                <span className="text-xs text-neutral-500">
                  {formatActivityTime(ts)}
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
