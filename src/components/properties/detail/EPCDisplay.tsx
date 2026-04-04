import { Zap, ExternalLink } from "lucide-react";
import type { EpcRating } from "@/types/property";

// ---------------------------------------------------------------------------
// EPC band config
// ---------------------------------------------------------------------------

const EPC_BANDS: EpcRating[] = ["A", "B", "C", "D", "E", "F", "G"];

const EPC_COLORS: Record<EpcRating, string> = {
  A: "bg-success",
  B: "bg-success",
  C: "bg-success/70",
  D: "bg-warning",
  E: "bg-warning/70",
  F: "bg-error/70",
  G: "bg-error",
};

const EPC_TEXT_COLORS: Record<EpcRating, string> = {
  A: "text-success",
  B: "text-success",
  C: "text-success/70",
  D: "text-warning",
  E: "text-warning",
  F: "text-error/70",
  G: "text-error",
};

const EPC_BG_LIGHT: Record<EpcRating, string> = {
  A: "bg-success-light",
  B: "bg-success-light",
  C: "bg-success-light",
  D: "bg-warning-light",
  E: "bg-warning-light",
  F: "bg-error-light",
  G: "bg-error-light",
};

const EPC_DESCRIPTIONS: Record<EpcRating, string> = {
  A: "Very energy efficient — lower running costs",
  B: "Energy efficient — low running costs",
  C: "Fairly energy efficient — reasonable running costs",
  D: "Fairly energy efficient — average running costs",
  E: "Not very energy efficient — higher running costs",
  F: "Poor energy efficiency — high running costs",
  G: "Very poor energy efficiency — very high running costs",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = Readonly<{
  currentRating: EpcRating | null;
  currentScore?: number | null;
  potentialRating?: EpcRating | null;
  potentialScore?: number | null;
  postcode?: string;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EPCDisplay({
  currentRating,
  currentScore,
  potentialRating,
  potentialScore,
  postcode,
}: Props) {
  if (!currentRating) {
    return (
      <div className="rounded-2xl bg-neutral-50 p-5 space-y-2">
        <div className="flex items-center gap-2 text-neutral-500">
          <Zap className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">Energy Performance Certificate</p>
        </div>
        <p className="text-xs text-neutral-400">EPC data not available for this property.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-neutral-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
            <Zap className="size-4 text-neutral-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Energy Performance</p>
            {currentScore != null && (
              <p className="text-xs text-neutral-500">{currentScore}/100 points</p>
            )}
          </div>
        </div>

        {/* Current rating badge */}
        <div
          className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 min-w-[52px] ${EPC_BG_LIGHT[currentRating]}`}
          aria-label={`Current EPC rating: ${currentRating}`}
        >
          <span className={`text-2xl font-bold leading-none ${EPC_TEXT_COLORS[currentRating]}`}>
            {currentRating}
          </span>
          <span className="text-xs text-neutral-500 mt-0.5">Current</span>
        </div>
      </div>

      {/* Band bar */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">Energy efficiency rating</p>
        <div className="flex items-stretch gap-0.5 h-8 rounded-lg overflow-hidden">
          {EPC_BANDS.map((band) => {
            const isCurrent = band === currentRating;
            return (
              <div
                key={band}
                className={[
                  "flex flex-1 items-center justify-center text-xs font-bold text-white transition-all duration-200",
                  EPC_COLORS[band],
                  isCurrent ? "scale-y-110 shadow-md z-10 relative" : "opacity-50",
                ].join(" ")}
                aria-label={`Band ${band}${isCurrent ? " (current)" : ""}`}
              >
                {band}
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-600 leading-relaxed">
        <span className="font-semibold text-neutral-900">Rating {currentRating}</span>
        {" — "}
        {EPC_DESCRIPTIONS[currentRating]}
      </p>

      {/* Potential rating */}
      {potentialRating && (
        <div className="flex items-center gap-3 pt-3 border-t border-neutral-200">
          <div
            className={`size-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 ${EPC_COLORS[potentialRating]}`}
            aria-hidden="true"
          >
            {potentialRating}
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-700">
              Potential rating: {potentialRating}
              {potentialScore != null ? ` (${potentialScore}/100)` : ""}
            </p>
            <p className="text-xs text-neutral-500">{EPC_DESCRIPTIONS[potentialRating]}</p>
          </div>
        </div>
      )}

      {/* Gov.uk link */}
      {postcode && (
        <a
          href={`https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(postcode)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
          aria-label="View full EPC certificate on gov.uk (opens in new tab)"
        >
          View full EPC certificate
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
