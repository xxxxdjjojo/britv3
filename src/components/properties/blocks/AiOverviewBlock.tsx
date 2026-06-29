import { AiScoreCard } from "@/components/properties/blocks/AiScoreCard";
import { AiSummaryCard } from "@/components/properties/blocks/AiSummaryCard";
import { computePropertyScore } from "@/services/properties/property-score-service";
import { getPropertySummary } from "@/services/properties/ai-summary-service";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 03 — AI overview feature band. Computes the heuristic score once, then
 * renders the LLM "why you'll love this home" summary alongside the transparent
 * TrueDeed Score. Async; wrap in Suspense. Each child self-gates, so the band
 * collapses entirely when there is nothing to show.
 */
export async function AiOverviewBlock({ view }: { view: PropertyView }) {
  const score = await computePropertyScore(view);
  const hasScore = score.dimensions.length > 0;

  const summary = await getPropertySummary(view, score);
  if (!hasScore && !summary) return null;

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_360px]">
      <AiSummaryCard summary={summary} />
      {hasScore && <AiScoreCard score={score} />}
    </section>
  );
}
