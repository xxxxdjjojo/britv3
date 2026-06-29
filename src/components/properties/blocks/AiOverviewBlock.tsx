import { AiScoreCard } from "@/components/properties/blocks/AiScoreCard";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 03 — AI overview feature band. Holds the transparent TrueDeed Score
 * (heuristic, from open data). Phase 3 adds the LLM "why you'll love this home"
 * summary alongside it. Each child self-gates, so the band collapses cleanly
 * when there is nothing to show.
 */
export function AiOverviewBlock({ view }: { view: PropertyView }) {
  return (
    <section className="mb-8">
      <AiScoreCard view={view} />
    </section>
  );
}
