/**
 * Gathers the open-data signals for a property and computes its heuristic
 * TrueDeed score. Reuses the existing cached local-area services so a property
 * page render adds no new uncached round-trips. Each signal degrades to null;
 * the pure scoring lib self-gates the corresponding dimension.
 */

import { getMobilityScores } from "@/services/properties/mobility-service";
import { getFloodRisk } from "@/services/properties/flood-service";
import { getNearbyTransport } from "@/services/properties/transport-service";
import { getPostcodeCard } from "@/services/market-map/postcode-card-service";
import {
  buildBuyerScore,
  buildRenterScore,
  type PropertyScore,
  type ScoreInputs,
} from "@/lib/properties/property-score";
import {
  assessValuePosition,
  bandForPropertyType,
} from "@/lib/properties/price-position";
import type { PropertyView } from "@/lib/properties/build-property-view";

export async function computePropertyScore(
  view: PropertyView,
): Promise<PropertyScore> {
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

  return listing.listingType === "rent"
    ? buildRenterScore(inputs)
    : buildBuyerScore(inputs);
}
