/**
 * Heuristic property scores — pure, transparent, deterministic.
 *
 * Each dimension is a 0–5★ banding of a real signal the page already has; the
 * overall is the mean of the available dimensions scaled to /100. There is NO
 * LLM in this path and NO hallucinated numbers — every star carries a `basis`
 * string stating exactly why. Dimensions self-gate: a signal that is null is
 * omitted from both the dimension list and the overall mean.
 */

export type ScoreInputs = {
  /** EPC band A–G. */
  epcRating?: string | null;
  /** (price − area median) / area median. Negative = cheaper than the area. */
  valueDeltaPct?: number | null;
  /** Environment Agency band: "Very Low" | "Low" | "Medium" | "High". */
  floodBand?: string | null;
  /** Mobility transit score 0–100. */
  transitScore?: number | null;
  /** Mobility walk score 0–100. */
  walkScore?: number | null;
  /** Count of nearby transport stops. */
  transportStopCount?: number | null;
  /** Best nearby Ofsted rating: "Outstanding" | "Good" | "Requires improvement" | "Inadequate". */
  schoolRating?: string | null;
};

export type ScoreDimension = {
  key: string;
  label: string;
  /** 1–5. */
  stars: number;
  basis: string;
};

export type PropertyScore = {
  /** 0–100, mean of the available dimensions. */
  overall: number;
  dimensions: ScoreDimension[];
};

// --- Banding helpers (each returns 1–5, or null when the signal is absent) ---

function bandEpc(rating?: string | null): { stars: number; basis: string } | null {
  if (!rating) return null;
  const r = rating.trim().toUpperCase();
  const map: Record<string, number> = { A: 5, B: 5, C: 4, D: 3, E: 2, F: 1, G: 1 };
  const stars = map[r];
  if (!stars) return null;
  return { stars, basis: `EPC band ${r}` };
}

function bandValue(deltaPct?: number | null): { stars: number; basis: string } | null {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return null;
  const pct = Math.round(deltaPct * 100);
  const stars =
    deltaPct <= -0.1 ? 5 : deltaPct <= -0.05 ? 4 : deltaPct < 0.05 ? 3 : deltaPct < 0.1 ? 2 : 1;
  const rel = pct === 0 ? "in line with" : `${Math.abs(pct)}% ${pct < 0 ? "below" : "above"}`;
  return { stars, basis: `Priced ${rel} the area median` };
}

function bandFlood(floodBand?: string | null): { stars: number; basis: string } | null {
  if (!floodBand) return null;
  const map: Record<string, number> = {
    "very low": 5,
    low: 4,
    medium: 2,
    high: 1,
  };
  const stars = map[floodBand.trim().toLowerCase()];
  if (!stars) return null;
  return { stars, basis: `${floodBand} flood risk` };
}

function bandScore0to100(
  value: number | null | undefined,
  noun: string,
): { stars: number; basis: string } | null {
  if (value == null || !Number.isFinite(value)) return null;
  const stars = value >= 80 ? 5 : value >= 60 ? 4 : value >= 40 ? 3 : value >= 20 ? 2 : 1;
  return { stars, basis: `${noun} ${Math.round(value)}/100` };
}

function bandTransport(count?: number | null): { stars: number; basis: string } | null {
  if (count == null || !Number.isFinite(count)) return null;
  const stars = count >= 8 ? 5 : count >= 5 ? 4 : count >= 3 ? 3 : count >= 1 ? 2 : 1;
  return { stars, basis: `${count} transport stop${count === 1 ? "" : "s"} nearby` };
}

function bandSchool(rating?: string | null): { stars: number; basis: string } | null {
  if (!rating) return null;
  const map: Record<string, number> = {
    outstanding: 5,
    good: 4,
    "requires improvement": 2,
    inadequate: 1,
  };
  const stars = map[rating.trim().toLowerCase()];
  if (!stars) return null;
  return { stars, basis: `Nearest school rated "${rating}"` };
}

function assemble(
  entries: Array<{ key: string; label: string; band: { stars: number; basis: string } | null }>,
): PropertyScore {
  const dimensions: ScoreDimension[] = entries
    .filter((e) => e.band !== null)
    .map((e) => ({ key: e.key, label: e.label, stars: e.band!.stars, basis: e.band!.basis }));

  const overall =
    dimensions.length === 0
      ? 0
      : Math.round(
          (dimensions.reduce((sum, d) => sum + d.stars, 0) / (dimensions.length * 5)) * 100,
        );

  return { overall, dimensions };
}

/** Buyer score — value, energy, commuting, lifestyle, safety (flood), schools. */
export function buildBuyerScore(inputs: ScoreInputs): PropertyScore {
  return assemble([
    { key: "value", label: "Value", band: bandValue(inputs.valueDeltaPct) },
    { key: "energy", label: "Energy", band: bandEpc(inputs.epcRating) },
    { key: "commuting", label: "Commuting", band: bandScore0to100(inputs.transitScore, "Transit score") },
    { key: "lifestyle", label: "Lifestyle", band: bandScore0to100(inputs.walkScore, "Walk score") },
    { key: "schools", label: "Schools", band: bandSchool(inputs.schoolRating) },
    { key: "risk", label: "Flood safety", band: bandFlood(inputs.floodBand) },
  ]);
}

/** Renter score — value, commuting, connectivity, lifestyle, energy/bills, safety. */
export function buildRenterScore(inputs: ScoreInputs): PropertyScore {
  return assemble([
    { key: "value", label: "Value", band: bandValue(inputs.valueDeltaPct) },
    { key: "commuting", label: "Commuting", band: bandScore0to100(inputs.transitScore, "Transit score") },
    { key: "connectivity", label: "Connectivity", band: bandTransport(inputs.transportStopCount) },
    { key: "lifestyle", label: "Lifestyle", band: bandScore0to100(inputs.walkScore, "Walk score") },
    { key: "energy", label: "Energy / bills", band: bandEpc(inputs.epcRating) },
    { key: "risk", label: "Flood safety", band: bandFlood(inputs.floodBand) },
  ]);
}
