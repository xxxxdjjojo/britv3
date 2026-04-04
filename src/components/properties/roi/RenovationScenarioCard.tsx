/**
 * RenovationScenarioCard
 *
 * Displays a single renovation scenario with cost range, estimated value
 * uplift, and a confidence badge.
 *
 * Server component — no client interactivity required.
 */

import type { ROIRenovation } from "@/services/properties/roi-estimation-service";

type Props = Readonly<{
  renovation: ROIRenovation;
}>;

/** Converts snake_case renovation type to Title Case human label. */
function humaniseType(raw: string): string {
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Formats a GBP integer with toLocaleString — never returns NaN. */
function formatGBP(value: number | undefined): string {
  const safe = Number.isFinite(value) ? (value as number) : 0;
  return `£${safe.toLocaleString("en-GB")}`;
}

type ConfidenceLevel = ROIRenovation["confidence"];

const confidenceBadge: Record<
  ConfidenceLevel,
  { label: string; className: string }
> = {
  high: {
    label: "High confidence",
    className:
      "bg-success-light text-success border border-success/20",
  },
  medium: {
    label: "Medium confidence",
    className:
      "bg-warning-light text-warning border border-warning/20",
  },
  low: {
    label: "Low confidence",
    className:
      "bg-neutral-100 text-neutral-600 border border-neutral-200",
  },
};

export function RenovationScenarioCard({ renovation }: Props) {
  const { label, className } = confidenceBadge[renovation.confidence] ?? confidenceBadge.low;

  const costLow = formatGBP(renovation.cost_low);
  const costHigh = formatGBP(renovation.cost_high);

  const upliftValue = Number.isFinite(renovation.value_uplift_pct)
    ? renovation.value_uplift_pct.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })
    : "0";

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row: title + confidence badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-brand-primary text-base leading-tight">
          {humaniseType(renovation.type)}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
        >
          {label}
        </span>
      </div>

      {/* Cost range */}
      <div className="flex items-center gap-1.5 text-sm text-neutral-700">
        <span className="text-neutral-400">Cost range:</span>
        <span className="font-medium">
          {costLow} &ndash; {costHigh}
        </span>
      </div>

      {/* Value uplift */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-400">Est. value uplift:</span>
        <span className="font-semibold text-brand-secondary text-sm">
          +{upliftValue}%
        </span>
      </div>
    </article>
  );
}
