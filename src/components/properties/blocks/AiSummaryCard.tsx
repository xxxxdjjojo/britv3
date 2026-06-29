import { Heart, Check, Minus, Target } from "lucide-react";
import type { PropertySummary } from "@/services/properties/ai-summary-service";

/**
 * Block 03 (left) — "Why you'll love this home". Renders the LLM (or templated
 * fallback) summary: highlights, pros, cons, and who it's ideal for. The prose
 * is generated over computed facts only; this component is presentational.
 */
export function AiSummaryCard({ summary }: { summary: PropertySummary | null }) {
  if (!summary) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Heart className="size-4" />
        </span>
        <h2 className="text-lg font-semibold">Why you&apos;ll love this home</h2>
      </div>

      {summary.highlights.length > 0 && (
        <ul className="space-y-1.5">
          {summary.highlights.map((h) => (
            <li key={h} className="flex gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-primary" />
              {h}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {summary.pros.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Pros</p>
            <ul className="space-y-1">
              {summary.pros.map((p) => (
                <li key={p} className="flex gap-1.5 text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {summary.cons.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Worth checking</p>
            <ul className="space-y-1">
              {summary.cons.map((c) => (
                <li key={c} className="flex gap-1.5 text-sm">
                  <Minus className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {summary.idealFor.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Target className="size-3.5" />
            Ideal for
          </span>
          {summary.idealFor.map((t) => (
            <span
              key={t}
              className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs text-brand-primary"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        AI-generated from this listing&apos;s facts. Always verify details with
        the agent.
      </p>
    </div>
  );
}
