import type { ChainRiskLevel, ChainRiskFactor, SaleStage } from "@/types/agent";

// Stage risk weights — later stages carry higher risk if stalled
const STAGE_RISK_WEIGHT: Record<SaleStage, number> = {
  offer_accepted: 1,
  memorandum_of_sale: 1.2,
  solicitors_instructed: 1.3,
  searches: 1.4,
  survey: 1.5,
  mortgage: 1.7,
  exchange: 2.0,
  completion: 1.0, // completion stalling is rare
};

export function scoreToLevel(score: number): ChainRiskLevel {
  if (score < 20) return "low";
  if (score < 45) return "medium";
  if (score < 70) return "high";
  return "critical";
}

export function detectCircularChain(
  links: ReadonlyArray<{ upstream_id: string; downstream_id: string }>,
  startId: string,
  maxDepth = 10,
): boolean {
  if (links.length === 0) return false;

  const visited = new Set<string>();
  const stack = [startId];

  while (stack.length > 0 && visited.size <= maxDepth) {
    const current = stack.pop()!;
    if (visited.has(current)) return true;
    visited.add(current);

    for (const link of links) {
      if (link.upstream_id === current) {
        if (link.downstream_id === startId) return true;
        if (!visited.has(link.downstream_id)) {
          stack.push(link.downstream_id);
        }
      }
    }
  }

  return false;
}

type ChainMemberInput = {
  id: string;
  stage: SaleStage;
  days_in_stage: number;
  updated_at: string;
};

type ScoreResult = {
  risk_score: number;
  risk_level: ChainRiskLevel;
  factors: ChainRiskFactor[];
  slowest_link_id: string | null;
  slowest_link_days: number;
};

export function computeChainRiskScore(
  members: ChainMemberInput[],
  targetId: string,
  targetPosition: number,
): ScoreResult {
  const factors: ChainRiskFactor[] = [];
  let score = 0;

  // Factor 1: Chain length
  const chainLength = members.length;
  if (chainLength >= 5) {
    score += 25;
    factors.push({ factor: "chain_length", weight: 25, detail: `${chainLength} links (long chain)` });
  } else if (chainLength >= 3) {
    score += 15;
    factors.push({ factor: "chain_length", weight: 15, detail: `${chainLength} links` });
  } else {
    score += 5;
    factors.push({ factor: "chain_length", weight: 5, detail: `${chainLength} links (short)` });
  }

  // Factor 2: Worst days-in-stage across all members
  let slowestId: string | null = null;
  let slowestDays = 0;
  for (const m of members) {
    if (m.days_in_stage > slowestDays) {
      slowestDays = m.days_in_stage;
      slowestId = m.id;
    }
  }

  if (slowestDays > 21) {
    score += 30;
    factors.push({ factor: "stall_duration", weight: 30, detail: `${slowestDays} days stalled` });
  } else if (slowestDays > 14) {
    score += 20;
    factors.push({ factor: "stall_duration", weight: 20, detail: `${slowestDays} days stalled` });
  } else if (slowestDays > 7) {
    score += 10;
    factors.push({ factor: "stall_duration", weight: 10, detail: `${slowestDays} days at stage` });
  }

  // Factor 3: Stage velocity — weighted average of days_in_stage * stage_weight
  let weightedTotal = 0;
  for (const m of members) {
    const w = STAGE_RISK_WEIGHT[m.stage] ?? 1;
    weightedTotal += m.days_in_stage * w;
  }
  const avgWeighted = weightedTotal / Math.max(chainLength, 1);
  const velocityPenalty = Math.min(25, Math.floor(avgWeighted / 2));
  if (velocityPenalty > 0) {
    score += velocityPenalty;
    factors.push({ factor: "stage_velocity", weight: velocityPenalty, detail: `Avg weighted: ${avgWeighted.toFixed(1)}` });
  }

  // Factor 4: Position penalty — chain tail gets +10
  if (targetPosition >= chainLength && chainLength > 1) {
    score += 10;
    factors.push({ factor: "tail_position", weight: 10, detail: "End of chain (most dependent)" });
  }

  // Clamp
  score = Math.min(100, Math.max(0, score));

  return {
    risk_score: score,
    risk_level: scoreToLevel(score),
    factors,
    slowest_link_id: slowestId,
    slowest_link_days: slowestDays,
  };
}
