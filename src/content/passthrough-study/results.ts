/**
 * Portal Cost Passthrough Study — founder agent-survey results
 * (Influence Strategy Phase 3, item 3.1a / Campaign 2).
 *
 * SHIPS EMPTY BY DESIGN. Fieldwork is an operational task, not a code task:
 * this file defines the shape of a finding and the study's disclosed design,
 * and `findings` stays an empty array until real survey responses exist.
 * The report page renders the methodology plus an honest
 * "fieldwork in progress" state while there are no findings.
 *
 * LEGAL FRAMING (non-negotiable):
 * - NO placeholder numbers, ever. A finding only enters this file when it is
 *   computed from real responses and clears the disclosed minimum-n
 *   threshold below.
 * - Every finding states its exact question, its n, and how the statistic
 *   was computed. Nothing aggregated across differently-worded questions.
 * - Published portal figures (ARPA, commission ranges, the CAT claim) live in
 *   `src/config/portal-cost-assumptions.ts`, not here — this file is survey
 *   results only.
 */

export type PassthroughFinding = {
  /** The exact survey question the finding answers, verbatim. */
  question: string;
  /** Number of responses the statistic is computed from. */
  n: number;
  /** How the statistic was computed (e.g. "median of numeric responses"). */
  method: string;
  /** The headline statistic, pre-formatted for display (e.g. "62%"). */
  statistic: string;
  /** Optional plain-English elaboration or caveat for this finding. */
  detail?: string;
};

export type PassthroughStudy = {
  /**
   * `fieldwork_in_progress` renders the honest holding state;
   * `published` renders findings publicly. Findings present while the status
   * is still `fieldwork_in_progress` are embargoed (press preview via token).
   */
  status: "fieldwork_in_progress" | "published";
  /** Edition label — used for embargo previews and the view-tracking key. */
  edition: string;
  /** The core research question the study answers. */
  question: string;
  /** Fieldwork method, disclosed up front — before any results exist. */
  method: string;
  findings: ReadonlyArray<PassthroughFinding>;
};

/** Bump when the computation or survey instrument changes; never mix versions. */
export const PASSTHROUGH_STUDY_METHODOLOGY_VERSION = 1;

/**
 * Disclosed suppression threshold: no finding publishes from fewer responses
 * than this, pre-committed here before fieldwork so it cannot be tuned to
 * flatter the data.
 */
export const PASSTHROUGH_STUDY_MIN_N = 30;

export const PASSTHROUGH_STUDY: PassthroughStudy = {
  status: "fieldwork_in_progress",
  edition: "2026-wave-1",
  question:
    "Do UK estate agents treat portal subscription costs as an overhead that shapes the fees they quote sellers — and if so, how?",
  method:
    "Structured survey of UK estate-agency branch decision-makers, conducted directly by TrueDeed's founder. Questions are fixed in advance, asked verbatim, and answered anonymously at branch level. Every published finding reports its exact question wording, its n, and its computation; findings below the disclosed minimum-n threshold are suppressed, never estimated.",
  findings: [],
};
