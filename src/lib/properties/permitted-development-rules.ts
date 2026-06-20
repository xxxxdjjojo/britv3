/**
 * Permitted Development ("what you could build") ruleset.
 *
 * Pure, static, in-memory. Indicative by property type only — there is NO
 * per-property planning data (conservation area, Article 4, listed status are
 * not stored). England-oriented householder PD rules of thumb. Always shown
 * with the standard caveat (see PD_CAVEAT). Not legal advice.
 *
 * Future constraint-awareness hooks in via the optional `opts` arg.
 */

export type PdScenario =
  | "rear_extension"
  | "side_return"
  | "loft_dormer"
  | "outbuilding_garden_room"
  | "garage_conversion"
  | "porch";

export type PdFeasibility =
  | "likely_permitted"
  | "needs_full_planning"
  | "not_applicable";

export type PdScenarioAssessment = {
  scenario: PdScenario;
  label: string;
  feasibility: PdFeasibility;
  note: string;
};

export type PdAssessment = {
  applicable: boolean;
  scenarios: PdScenarioAssessment[];
  headline: string;
};

export type PdAssessmentOptions = {
  // Reserved for future per-property constraint-awareness. Unused today.
  conservationArea?: boolean;
};

/** Canonical scenario order for display + count assertions. */
export const PD_SCENARIO_ORDER: readonly PdScenario[] = [
  "rear_extension",
  "side_return",
  "loft_dormer",
  "outbuilding_garden_room",
  "garage_conversion",
  "porch",
] as const;

export const PD_SCENARIO_LABELS: Record<PdScenario, string> = {
  rear_extension: "Rear/single-storey extension",
  side_return: "Side return / side extension",
  loft_dormer: "Loft / dormer conversion",
  outbuilding_garden_room: "Outbuilding / garden room",
  garage_conversion: "Garage conversion",
  porch: "Porch",
};

export const PD_CAVEAT =
  "Indicative only, based on property type. Permitted development rights are " +
  "removed or restricted in conservation areas, by Article 4 directions, for " +
  "listed buildings, and where rights have already been used. Always confirm " +
  "with your local planning authority before starting any work.";

type HouseProfile = Record<PdScenario, { feasibility: PdFeasibility; note: string }>;

const DETACHED_LIKE: HouseProfile = {
  rear_extension: {
    feasibility: "likely_permitted",
    note: "Single-storey rear extensions are often permitted within depth and height limits.",
  },
  side_return: {
    feasibility: "likely_permitted",
    note: "Side extensions are often possible on detached/bungalow plots within width limits.",
  },
  loft_dormer: {
    feasibility: "likely_permitted",
    note: "Loft conversions with rear dormers are often permitted within volume limits.",
  },
  outbuilding_garden_room: {
    feasibility: "likely_permitted",
    note: "Garden rooms/outbuildings are often permitted if single-storey and within size limits.",
  },
  garage_conversion: {
    feasibility: "likely_permitted",
    note: "Converting an attached garage to living space is often permitted development.",
  },
  porch: {
    feasibility: "likely_permitted",
    note: "Small front porches are often permitted within floor-area and height limits.",
  },
};

const SEMI_TERRACED: HouseProfile = {
  rear_extension: {
    feasibility: "likely_permitted",
    note: "Single-storey rear extensions are often permitted, with smaller depth limits than detached homes.",
  },
  side_return: {
    feasibility: "needs_full_planning",
    note: "Side extensions on semi-detached/terraced homes usually need full planning permission.",
  },
  loft_dormer: {
    feasibility: "likely_permitted",
    note: "Rear dormer loft conversions are often permitted within a smaller volume allowance.",
  },
  outbuilding_garden_room: {
    feasibility: "likely_permitted",
    note: "Garden rooms/outbuildings are often permitted if single-storey and within size limits.",
  },
  garage_conversion: {
    feasibility: "likely_permitted",
    note: "Converting an attached garage to living space is often permitted development.",
  },
  porch: {
    feasibility: "likely_permitted",
    note: "Small front porches are often permitted within floor-area and height limits.",
  },
};

// detached & bungalow share the generous profile; semi/terraced/cottage share the tighter one.
const HOUSE_PROFILES: Record<string, HouseProfile> = {
  detached: DETACHED_LIKE,
  bungalow: DETACHED_LIKE,
  semi_detached: SEMI_TERRACED,
  terraced: SEMI_TERRACED,
  cottage: SEMI_TERRACED,
};

const HOUSE_HEADLINE =
  "Homes like this often have permitted development rights for common projects — subject to checks:";

const NOT_APPLICABLE_HEADLINE =
  "Permitted development rights generally don't apply to flats and maisonettes — most changes need freeholder consent and/or planning permission.";

/**
 * Maps the ROI service renovation types to PD scenarios (for the badge on the
 * renovation scenario cards). Returns null when there is no PD equivalent.
 */
export function roiTypeToPdScenario(roiType: string): PdScenario | null {
  switch (roiType) {
    case "loft_conversion":
      return "loft_dormer";
    case "extension":
      return "rear_extension";
    default:
      return null;
  }
}

export function assessPermittedDevelopment(
  propertyType: string,
  _opts: PdAssessmentOptions = {},
): PdAssessment {
  const profile = HOUSE_PROFILES[propertyType];

  if (!profile) {
    return {
      applicable: false,
      scenarios: [],
      headline: NOT_APPLICABLE_HEADLINE,
    };
  }

  const scenarios: PdScenarioAssessment[] = PD_SCENARIO_ORDER.map((scenario) => ({
    scenario,
    label: PD_SCENARIO_LABELS[scenario],
    feasibility: profile[scenario].feasibility,
    note: profile[scenario].note,
  }));

  return { applicable: true, scenarios, headline: HOUSE_HEADLINE };
}
