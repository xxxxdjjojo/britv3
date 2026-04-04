import { Droplets, ExternalLink, ShieldCheck } from "lucide-react";

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
  {
    badgeClass: string;
    dotClass: string;
    bgClass: string;
    textClass: string;
    description: string;
  }
> = {
  Low: {
    badgeClass: "bg-success-light text-success-dark",
    dotClass: "bg-success",
    bgClass: "bg-success-light",
    textClass: "text-success",
    description:
      "Low probability of flooding. Less than 1 in 1,000 chance of river or sea flooding each year.",
  },
  Medium: {
    badgeClass: "bg-warning-light text-warning-dark",
    dotClass: "bg-warning",
    bgClass: "bg-warning-light",
    textClass: "text-warning",
    description:
      "Medium probability of flooding. Between 1 in 100 and 1 in 1,000 chance of river or sea flooding each year.",
  },
  High: {
    badgeClass: "bg-warning-light text-warning-dark",
    dotClass: "bg-warning",
    bgClass: "bg-warning-light",
    textClass: "text-warning",
    description:
      "High probability of flooding. Greater than 1 in 100 chance of river or sea flooding each year.",
  },
  "Very High": {
    badgeClass: "bg-error-light text-error-dark",
    dotClass: "bg-error",
    bgClass: "bg-error-light",
    textClass: "text-error",
    description:
      "Very high probability of flooding. Property is in an area known to flood regularly. Consider specialist insurance and flood resilience measures.",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloodRiskWidget({ riskLevel, source }: Props) {
  if (!riskLevel) {
    return (
      <div className="rounded-2xl bg-neutral-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
            <Droplets className="size-4 text-neutral-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-neutral-900">Flood Risk</p>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Flood risk data unavailable. Check the official{" "}
          <a
            href="https://check-long-term-flood-risk.service.gov.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-brand-primary underline underline-offset-2 hover:opacity-80"
            aria-label="Check flood risk on gov.uk (opens in new tab)"
          >
            gov.uk flood risk checker
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          .
        </p>
      </div>
    );
  }

  const config = RISK_CONFIG[riskLevel];

  return (
    <div className="rounded-2xl bg-neutral-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
            <Droplets className="size-4 text-neutral-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-neutral-900">Flood Risk</p>
        </div>

        {/* Risk badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClass}`}
          aria-label={`Flood risk level: ${riskLevel}`}
        >
          <span className={`size-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
          {riskLevel}
        </span>
      </div>

      {/* Visual risk indicator */}
      <div className={`rounded-xl p-3 ${config.bgClass}`}>
        <div className="flex items-center gap-2">
          {riskLevel === "Low" ? (
            <ShieldCheck className={`size-4 shrink-0 ${config.textClass}`} aria-hidden="true" />
          ) : (
            <Droplets className={`size-4 shrink-0 ${config.textClass}`} aria-hidden="true" />
          )}
          <p className={`text-xs font-medium leading-relaxed ${config.textClass}`}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Source */}
      {source && (
        <p className="text-xs text-neutral-500">
          Source:{" "}
          <span className="font-medium text-neutral-700">{source}</span>
        </p>
      )}

      {/* Gov.uk link */}
      <a
        href="https://check-long-term-flood-risk.service.gov.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
        aria-label="Check detailed flood risk on gov.uk (opens in new tab)"
      >
        Check detailed flood risk
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
    </div>
  );
}
