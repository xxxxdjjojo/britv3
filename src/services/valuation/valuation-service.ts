import { valuate, type ValuateOptions, type RawComparable } from "@/lib/valuation/engine";
import { normalisePostcode, outwardCode } from "@/lib/valuation/postcode";
import { normaliseAddressToken } from "@/lib/valuation/address";
import {
  PREFERRED_WINDOW_MONTHS,
  MAX_WINDOW_MONTHS,
  PROXIMITY_SAME_POSTCODE_M,
  PROXIMITY_SAME_STREET_M,
} from "@/lib/valuation/constants";
import type { HpiPoint } from "@/lib/valuation/hpi";
import type { ValuationSubject, ValuationResult, ComparableSale } from "@/types/valuation";
import {
  fetchComparables,
  fetchSubjectPriorSale,
  propertyFamily,
} from "./comparables-repo";

/** Below this comparable count we widen the recency window before estimating. */
const MIN_COMPARABLES = 6;

/**
 * Proxy distance from shared address parts, used until an address gazetteer
 * supplies true coordinates. Same full postcode ≈ adjacent; same street ≈ nearby;
 * otherwise unknown (neutral). This makes local comparables dominate the estimate
 * instead of the whole outward code's average.
 */
function proximityProxyMetres(
  comp: RawComparable,
  normalisedPostcode: string | null,
  subjectStreet: string | null,
): number | null {
  if (normalisedPostcode && normalisePostcode(comp.postcode) === normalisedPostcode) {
    return PROXIMITY_SAME_POSTCODE_M;
  }
  if (subjectStreet && comp.street && normaliseAddressToken(comp.street) === subjectStreet) {
    return PROXIMITY_SAME_STREET_M;
  }
  return null;
}

function monthsBefore(date: string, months: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

export type CalculateValuationInput = Readonly<{
  subject: ValuationSubject;
  valuationDate: string; // ISO YYYY-MM-DD
  dataCutoffDate?: string | null;
  hpiSeries?: readonly HpiPoint[];
}>;

/**
 * End-to-end indicative valuation from real HM Land Registry data:
 * normalise → fetch eligible comparables (adaptive recency window) → anchor on
 * the subject's prior sale if matchable → run the comparable engine.
 *
 * Returns a Level E (no-estimate) result rather than throwing when the postcode
 * is invalid or no data exists (e.g. Scotland, which is absent from the data).
 */
export async function calculateValuation(
  input: CalculateValuationInput,
): Promise<ValuationResult> {
  const { subject, valuationDate } = input;
  const normalisedPostcode = normalisePostcode(subject.postcode);
  const outward = outwardCode(subject.postcode) ?? subject.outwardCode;

  const opts: ValuateOptions = {
    valuationDate,
    dataCutoffDate: input.dataCutoffDate ?? null,
    hpiSeries: input.hpiSeries,
  };

  if (!normalisedPostcode || !outward) {
    return valuate(subject, [], opts); // Level E
  }

  const types = propertyFamily(subject.propertyType);

  // Adaptive window: prefer the recent window, widen only if data is thin.
  let comparables = await fetchComparables({
    outwardCode: outward,
    types,
    sinceDate: monthsBefore(valuationDate, PREFERRED_WINDOW_MONTHS),
  });
  if (comparables.length < MIN_COMPARABLES) {
    comparables = await fetchComparables({
      outwardCode: outward,
      types,
      sinceDate: monthsBefore(valuationDate, MAX_WINDOW_MONTHS),
    });
  }

  // Apply the proximity proxy so local sales dominate the estimate.
  const subjectStreet = normaliseAddressToken(subject.street);
  comparables = comparables.map((c) => ({
    ...c,
    distanceMetres: proximityProxyMetres(c, normalisedPostcode, subjectStreet || null),
  }));

  // Anchor on the subject's own prior registered sale, if we can match it.
  let exactPriorSale: ComparableSale | null = null;
  if (subject.paon && normalisedPostcode) {
    const prior = await fetchSubjectPriorSale(normalisedPostcode, subject.paon, subject.saon);
    if (prior) {
      exactPriorSale = {
        transactionId: prior.transactionId,
        price: prior.price,
        adjustedPrice: null,
        saleDate: prior.saleDate,
        postcode: prior.postcode,
        outwardCode: prior.outwardCode,
        propertyType: prior.propertyType,
        newBuild: prior.newBuild,
        tenure: prior.tenure,
        paon: prior.paon,
        saon: prior.saon,
        street: prior.street,
        distanceMetres: 0,
      };
      // Exclude the subject's own sale from the comparable pool (no self-comp).
      comparables = comparables.filter((c) => c.transactionId !== prior.transactionId);
    }
  }

  return valuate(subject, comparables, { ...opts, exactPriorSale });
}
