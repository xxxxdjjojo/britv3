/**
 * Confidence classification for choropleth areas.
 * Thresholds from DESIGN.md §6.
 */

export type ConfidenceLevel = "High" | "Medium" | "Low" | "Insufficient";

/**
 * Classifies the confidence level of a price estimate based on how many
 * registered transactions contributed to it.
 *
 * Thresholds (DESIGN.md §6):
 *   ≥ 30  → High
 *   ≥ 10  → Medium
 *   ≥  5  → Low
 *   <  5  → Insufficient
 */
export function confidenceFor(transactionCount: number): ConfidenceLevel {
  if (transactionCount >= 30) return "High";
  if (transactionCount >= 10) return "Medium";
  if (transactionCount >= 5) return "Low";
  return "Insufficient";
}
