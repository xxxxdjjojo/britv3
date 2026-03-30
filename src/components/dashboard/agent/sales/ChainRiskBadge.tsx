import type { ChainRiskScore, ChainRiskLevel } from "@/types/agent";

const RISK_CONFIG: Record<
  ChainRiskLevel,
  { bg: string; text: string; label: string }
> = {
  low: {
    bg: "bg-success-light",
    text: "text-success",
    label: "Low risk",
  },
  medium: {
    bg: "bg-warning-light",
    text: "text-warning",
    label: "Medium risk",
  },
  high: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    label: "High risk",
  },
  critical: {
    bg: "bg-error-light",
    text: "text-error",
    label: "Critical risk",
  },
};

const RISK_DOT: Record<ChainRiskLevel, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-orange-500",
  critical: "bg-error",
};

export function ChainRiskBadge({ risk }: Readonly<{ risk: ChainRiskScore }>) {
  const cfg = RISK_CONFIG[risk.risk_level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${cfg.bg} ${cfg.text}`}
      title={`Chain: ${risk.chain_length} links, score ${risk.risk_score}/100, position ${risk.chain_position}`}
    >
      <span className={`size-1.5 rounded-full ${RISK_DOT[risk.risk_level]}`} />
      {cfg.label}
    </span>
  );
}
