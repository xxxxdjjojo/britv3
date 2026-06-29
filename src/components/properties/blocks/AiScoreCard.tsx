import { Star } from "lucide-react";
import { getMobilityScores } from "@/services/properties/mobility-service";
import { getFloodRisk } from "@/services/properties/flood-service";
import { getNearbyTransport } from "@/services/properties/transport-service";
import { getPostcodeCard } from "@/services/market-map/postcode-card-service";
import {
  buildBuyerScore,
  buildRenterScore,
  type ScoreInputs,
  type PropertyScore,
} from "@/lib/properties/property-score";
import {
  assessValuePosition,
  bandForPropertyType,
} from "@/lib/properties/price-position";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 03 (right) — the TrueDeed Score. A heuristic, fully transparent score
 * computed from real signals already on the page (EPC, value-vs-area, flood
 * risk, mobility, transport). No LLM, no invented numbers: every dimension
 * shows its basis. Self-gates — renders nothing when no signal is available.
 * Async (reuses the cached local-area services).
 */
export async function AiScoreCard({ view }: { view: PropertyView }) {
  const { listing, property } = view.detail;
  const coords = property.coordinates;

  const [mobility, flood, transport, card] = await Promise.all([
    getMobilityScores(property.id).catch(() => null),
    coords ? getFloodRisk(coords.lat, coords.lng).catch(() => null) : Promise.resolve(null),
    coords ? getNearbyTransport(coords.lat, coords.lng).catch(() => null) : Promise.resolve(null),
    getPostcodeCard(property.postcode).catch(() => null),
  ]);

  let valueDeltaPct: number | null = null;
  if (card?.found) {
    const series = card[bandForPropertyType(property.propertyType)];
    if (!series.insufficient && series.median != null) {
      valueDeltaPct = assessValuePosition(listing.price, series.median)?.deltaPct ?? null;
    }
  }

  const inputs: ScoreInputs = {
    epcRating: property.epcRating,
    valueDeltaPct,
    floodBand: flood?.riskLevel ?? null,
    transitScore: mobility?.transit ?? null,
    walkScore: mobility?.walk ?? null,
    transportStopCount: transport?.length ?? null,
    schoolRating: null,
  };

  const score: PropertyScore =
    listing.listingType === "rent" ? buildRenterScore(inputs) : buildBuyerScore(inputs);

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
              <span className="text-muted-foreground">{d.label}</span>
              <span className="flex shrink-0 items-center gap-0.5" aria-label={`${d.stars} out of 5`}>
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
