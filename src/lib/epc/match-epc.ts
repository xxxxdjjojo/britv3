/**
 * EPC ↔ property matching.
 *
 * UPRN is the reliable join (confidence 1.0). When a UPRN is unavailable on
 * either side we fall back to a postcode gate + PAON equality (confidence 0.9),
 * reusing the PPD matcher's normalisers so EPC and Land-Registry addressing are
 * compared the same way. Anything weaker is left UNLINKED — a wrong EPC band is
 * worse than a missing one. Pure functions; no I/O.
 */
import { normalisePostcode, paonsEqual } from "@/lib/truedeed/ppd-matcher";

export type EpcMatchInput = {
  uprn: string | null;
  postcode: string | null;
  paon: string | null;
};

export type EpcMatchResult = {
  matched: boolean;
  /** [0,1]; 1.0 UPRN, 0.9 postcode+PAON, 0 otherwise. */
  confidence: number;
};

const CONFIDENCE_UPRN = 1;
const CONFIDENCE_POSTCODE_PAON = 0.9;

export function matchEpc(
  property: EpcMatchInput,
  cert: EpcMatchInput,
): EpcMatchResult {
  if (
    property.uprn &&
    cert.uprn &&
    property.uprn.trim() === cert.uprn.trim()
  ) {
    return { matched: true, confidence: CONFIDENCE_UPRN };
  }

  if (
    property.postcode &&
    cert.postcode &&
    normalisePostcode(property.postcode) === normalisePostcode(cert.postcode) &&
    property.paon &&
    cert.paon &&
    paonsEqual(property.paon, cert.paon)
  ) {
    return { matched: true, confidence: CONFIDENCE_POSTCODE_PAON };
  }

  return { matched: false, confidence: 0 };
}

export type EpcCandidate = EpcMatchInput & {
  certificateNumber: string;
  inspectionDate: string | null;
};

export type EpcBestMatch = {
  certificateNumber: string;
  confidence: number;
};

/**
 * Pick the best-matching certificate for a property: highest confidence wins,
 * ties broken by the most recent inspection date. Returns null when no
 * candidate matches.
 */
export function pickBestEpc(
  property: EpcMatchInput,
  candidates: readonly EpcCandidate[],
): EpcBestMatch | null {
  let best: { cert: EpcCandidate; confidence: number } | null = null;

  for (const cert of candidates) {
    const { matched, confidence } = matchEpc(property, cert);
    if (!matched) continue;

    if (
      best === null ||
      confidence > best.confidence ||
      (confidence === best.confidence &&
        (cert.inspectionDate ?? "") > (best.cert.inspectionDate ?? ""))
    ) {
      best = { cert, confidence };
    }
  }

  return best
    ? { certificateNumber: best.cert.certificateNumber, confidence: best.confidence }
    : null;
}
