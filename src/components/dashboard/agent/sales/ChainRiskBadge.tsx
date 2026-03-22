import type { ChainRiskScore, ChainRiskLevel } from "@/types/agent";

const RISK_COLOURS: Record<ChainRiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const RISK_ICONS: Record<ChainRiskLevel, string> = {
  low: "\u{1F7E2}",
  medium: "\u{1F7E1}",
  high: "\u{1F7E0}",
  critical: "\u{1F534}",
};

export function ChainRiskBadge({ risk }: Readonly<{ risk: ChainRiskScore }>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${RISK_COLOURS[risk.risk_level]}`}
      title={`Chain: ${risk.chain_length} links, score ${risk.risk_score}/100, position ${risk.chain_position}`}
    >
      {RISK_ICONS[risk.risk_level]} {risk.risk_level}
    </span>
  );
}
