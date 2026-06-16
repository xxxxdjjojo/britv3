import { Droplets } from "lucide-react";
import type { FloodRiskLevel } from "@/services/properties/flood-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  riskLevel: FloodRiskLevel | null;
  source?: string | null;
}>;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RISK_CONFIG: Record<
  FloodRiskLevel,
  { badgeClass: string; dotClass: string; description: string }
> = {
  "Very Low": {
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    dotClass: "bg-green-500",
    description:
      "Very low risk. This area has less than a 0.1% (1 in 1,000) chance of flooding from rivers or the sea each year.",
  },
  Low: {
    badgeClass:
      "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
    dotClass: "bg-lime-500",
    description:
      "Low risk. This area has between a 0.1% (1 in 1,000) and 1% (1 in 100) chance of flooding from rivers or the sea each year.",
  },
  Medium: {
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dotClass: "bg-amber-500",
    description:
      "Medium risk. This area has between a 1% (1 in 100) and 3.3% (1 in 30) chance of flooding from rivers or the sea each year.",
  },
  High: {
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    dotClass: "bg-red-500",
    description:
      "High risk. This area has a 3.3% (1 in 30) or greater chance of flooding from rivers or the sea each year. These figures account for flood defences.",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloodRiskWidget({ riskLevel, source }: Props) {
  // Graceful absence: render nothing when there is no data to show.
  if (!riskLevel) {
    return null;
  }

  const config = RISK_CONFIG[riskLevel];

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Flood Risk</p>
        </div>
        {/* Risk badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}
        >
          <span className={`size-1.5 rounded-full ${config.dotClass}`} />
          {riskLevel}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {config.description}
      </p>

      {/* Source */}
      {source && (
        <p className="text-xs text-muted-foreground border-t pt-2">
          Source:{" "}
          <span className="text-foreground font-medium">{source}</span>
        </p>
      )}
    </div>
  );
}
