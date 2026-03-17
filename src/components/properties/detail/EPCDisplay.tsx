import { Zap } from "lucide-react";
import type { EpcRating } from "@/types/property";

// ---------------------------------------------------------------------------
// EPC band config
// ---------------------------------------------------------------------------

const EPC_BANDS: EpcRating[] = ["A", "B", "C", "D", "E", "F", "G"];

const EPC_COLORS: Record<EpcRating, string> = {
  A: "bg-green-600",
  B: "bg-green-500",
  C: "bg-lime-500",
  D: "bg-yellow-400",
  E: "bg-orange-400",
  F: "bg-orange-600",
  G: "bg-red-600",
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
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EPCDisplay({
  currentRating,
  currentScore,
  potentialRating,
  potentialScore,
}: Props) {
  if (!currentRating) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="size-4 shrink-0" />
          <p className="text-sm">EPC data not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Energy Performance Certificate</p>
        </div>
        {currentScore != null && (
          <span className="text-xs text-muted-foreground">
            {currentScore}/100
          </span>
        )}
      </div>

      {/* Band bar */}
      <div className="flex items-stretch gap-1 h-9">
        {EPC_BANDS.map((band) => {
          const isCurrent = band === currentRating;
          return (
            <div
              key={band}
              className={[
                "flex flex-1 items-center justify-center rounded text-xs font-bold text-white transition-transform",
                EPC_COLORS[band],
                isCurrent
                  ? "ring-2 ring-offset-1 ring-foreground scale-110 z-10"
                  : "opacity-60",
              ].join(" ")}
            >
              {band}
            </div>
          );
        })}
      </div>

      {/* Current rating description */}
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Rating {currentRating}</span>
        {" — "}
        {EPC_DESCRIPTIONS[currentRating]}
      </p>

      {/* Potential rating */}
      {potentialRating && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <div
            className={`size-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${EPC_COLORS[potentialRating]}`}
          >
            {potentialRating}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Potential:</span>{" "}
            {potentialRating}
            {potentialScore != null ? ` (${potentialScore})` : ""} —{" "}
            {EPC_DESCRIPTIONS[potentialRating]}
          </p>
        </div>
      )}
    </div>
  );
}
