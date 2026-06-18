import { CONFIDENCE_THRESHOLDS, type Confidence } from "./constants";

/**
 * Classify the confidence of an area's median based on its transaction count.
 *   High        >= 30
 *   Medium      >= 10
 *   Low         >= 5
 *   Insufficient < 5
 */
export function classifyConfidence(transactionCount: number): Confidence {
  if (transactionCount >= CONFIDENCE_THRESHOLDS.high) return "High";
  if (transactionCount >= CONFIDENCE_THRESHOLDS.medium) return "Medium";
  if (transactionCount >= CONFIDENCE_THRESHOLDS.low) return "Low";
  return "Insufficient";
}

/** Whether an area has enough transactions to be coloured (>= Low threshold). */
export function hasSufficientData(transactionCount: number): boolean {
  return transactionCount >= CONFIDENCE_THRESHOLDS.low;
}
