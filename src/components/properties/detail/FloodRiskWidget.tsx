import { Droplets } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = "Low" | "Medium" | "High" | "Very High";

type Props = Readonly<{
  riskLevel: RiskLevel | null;
  source?: string | null;
}>;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RISK_CONFIG: Record<
  RiskLevel,
  { badgeClass: string; dotClass: string; description: string }
> = {
  Low: {
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    dotClass: "bg-green-500",
    description:
      "Low probability of flooding. Less than 1 in 1,000 chance of river or sea flooding each year.",
  },
  Medium: {
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dotClass: "bg-amber-500",
    description:
      "Medium probability of flooding. Between 1 in 100 and 1 in 1,000 chance of river or sea flooding each year.",
  },
  High: {
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    dotClass: "bg-orange-500",
    description:
      "High probability of flooding. Greater than 1 in 100 chance of river or sea flooding, or greater than 1 in 200 chance of sea flooding each year.",
  },
  "Very High": {
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    dotClass: "bg-red-500",
    description:
      "Very high probability of flooding. Property is in an area known to flood regularly. Consider specialist insurance and flood resilience measures.",
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
