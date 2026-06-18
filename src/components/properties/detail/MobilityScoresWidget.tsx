import { Footprints, Bus, Bike } from "lucide-react";
import { scoreLabel } from "@/lib/properties/mobility-scoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Basis = Readonly<{
  walkAmenities: number | null;
  transitStops: number | null;
  bikeCycleways: number | null;
}>;

type Props = Readonly<{
  walk: number | null;
  transit: number | null;
  bike: number | null;
  basis?: Basis;
}>;

type Row = {
  key: "walk" | "transit" | "bike";
  label: string;
  icon: typeof Footprints;
  score: number | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Colour the bar/label by band — green (high) through red (low). */
function bandClass(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-lime-500";
  if (score >= 40) return "bg-amber-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function ScoreRow({ label, icon: Icon, score }: Readonly<Omit<Row, "key">>) {
  if (score == null) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5 shrink-0" />
          {label}
        </span>
        <span className="font-medium tabular-nums">
          {score}
          <span className="text-muted-foreground">/100</span>{" "}
          <span className="text-muted-foreground">· {scoreLabel(score)}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${bandClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function basisLine(basis: Basis): string | null {
  const parts: string[] = [];
  if (basis.walkAmenities != null) parts.push(`${basis.walkAmenities} amenities`);
  if (basis.transitStops != null) parts.push(`${basis.transitStops} stops`);
  if (basis.bikeCycleways != null) parts.push(`${basis.bikeCycleways} cycleways`);
  return parts.length > 0 ? `Based on ${parts.join(" · ")} nearby` : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Walk / Transit / Bike mobility scores. Server Component — presentational,
 * driven by precomputed scores. Renders nothing when no score is available
 * (graceful absence). Scores are an independent estimate, not Walk Score®.
 */
export function MobilityScoresWidget({ walk, transit, bike, basis }: Props) {
  if (walk == null && transit == null && bike == null) {
    return null;
  }

  const basis_ = basis ? basisLine(basis) : null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Footprints className="size-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-medium">Getting around</p>
      </div>

      <div className="space-y-2.5">
        <ScoreRow label="Walk" icon={Footprints} score={walk} />
        <ScoreRow label="Transit" icon={Bus} score={transit} />
        <ScoreRow label="Bike" icon={Bike} score={bike} />
      </div>

      {basis_ && <p className="text-[11px] text-muted-foreground">{basis_}</p>}

      <p className="border-t pt-2 text-[11px] text-muted-foreground">
        Estimated from OpenStreetMap &amp; transport data — an independent
        guide, not affiliated with Walk Score®.
      </p>
    </div>
  );
}
