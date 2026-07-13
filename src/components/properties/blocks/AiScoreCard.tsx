import { Star } from "lucide-react";
import type { PropertyScore } from "@/lib/properties/property-score";

/**
 * Block 03 (right) — the TrueDeed Score. Presentational: it renders a
 * precomputed heuristic score (see property-score-service). Fully transparent —
 * every dimension shows its basis on hover; no LLM, no invented numbers.
 * Self-gates: renders nothing when no dimension has a signal.
 */
export function AiScoreCard({ score }: { score: PropertyScore }) {
  if (score.dimensions.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-5">
        <div className="shrink-0 text-center">
          <div className="flex size-20 flex-col items-center justify-center rounded-2xl bg-brand-primary text-white">
            <span className="text-3xl font-bold leading-none">{score.overall}</span>
            <span className="text-[10px] opacity-80">/ 100</span>
          </div>
          <p className="mt-1.5 text-xs font-medium">TrueDeed Score</p>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {score.dimensions.map((d) => (
            <li
              key={d.key}
              className="flex items-center justify-between gap-3 text-sm"
              title={d.basis}
            >
              <span className="min-w-0 text-muted-foreground">{d.label}</span>
              <span
                className="flex shrink-0 items-center gap-0.5"
                aria-label={`${d.label}: ${d.stars} out of 5`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`size-3.5 ${n <= d.stars ? "fill-brand-primary text-brand-primary" : "text-muted-foreground/30"}`}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        A transparent estimate from open data (EPC, Land Registry, Environment
        Agency, transport). Each rating shows its basis on hover. Not financial
        advice.
      </p>
    </div>
  );
}
