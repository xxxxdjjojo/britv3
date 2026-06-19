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
  fetchPostcodeCentroids,
  fetchHpiSeries,
  propertyFamily,
} from "./comparables-repo";
import { haversineMetres } from "@/lib/valuation/distance";

/** Most frequent non-null district among comparables (for HPI region resolution). */
function modalDistrict(comparables: ReadonlyArray<{ district?: string | null }>): string | null {
  const counts = new Map<string, number>();
  for (const c of comparables) {
    if (c.district) counts.set(c.district, (counts.get(c.district) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [d, n] of counts) {
    if (n > bestN) {
      best = d;
      bestN = n;
    }
  }
  return best;
}

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
  /** Backtest: only use sales strictly before this date (no future leakage). */
  asOfDate?: string;
  /** Backtest: exclude this transaction so a target can't be its own comparable. */
  excludeTransactionId?: string;
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
  const beforeDate = input.asOfDate;
  const excludeTransactionId = input.excludeTransactionId;

  // Adaptive window: prefer the recent window, widen only if data is thin.
  let comparables = await fetchComparables({
    outwardCode: outward,
    types,
    sinceDate: monthsBefore(valuationDate, PREFERRED_WINDOW_MONTHS),
    beforeDate,
    excludeTransactionId,
  });
  if (comparables.length < MIN_COMPARABLES) {
    comparables = await fetchComparables({
      outwardCode: outward,
      types,
      sinceDate: monthsBefore(valuationDate, MAX_WINDOW_MONTHS),
      beforeDate,
      excludeTransactionId,
    });
  }

  // Distance weighting: prefer true postcode-centroid distance (open data); fall
  // back to the postcode/street proximity proxy when centroids aren't loaded.
  const subjectStreet = normaliseAddressToken(subject.street);
  const centroids = await fetchPostcodeCentroids([
    normalisedPostcode,
    ...comparables.map((c) => c.postcode),
  ]);
  const subjectCentroid = centroids.get(normalisedPostcode);
  comparables = comparables.map((c) => {
    const compCentroid = centroids.get(c.postcode);
    const distanceMetres =
      subjectCentroid && compCentroid
        ? Math.round(haversineMetres(subjectCentroid, compCentroid))
        : proximityProxyMetres(c, normalisedPostcode, subjectStreet || null);
    return { ...c, distanceMetres };
  });

  // Anchor on the subject's own prior registered sale, if we can match it.
  let exactPriorSale: ComparableSale | null = null;
  if (subject.paon && normalisedPostcode) {
    const prior = await fetchSubjectPriorSale(
      normalisedPostcode,
      subject.paon,
      subject.saon,
      beforeDate,
      excludeTransactionId,
    );
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
        weight: 0, // anchor only; excluded from the comparable pool, carries no estimate weight
      };
      // Exclude the subject's own sale from the comparable pool (no self-comp).
      comparables = comparables.filter((c) => c.transactionId !== prior.transactionId);
    }
  }

  // Real time-adjustment: HPI series by district + property type (national fallback).
  const hpiSeries =
    input.hpiSeries ?? (await fetchHpiSeries(modalDistrict(comparables), subject.propertyType));

  return valuate(subject, comparables, { ...opts, hpiSeries, exactPriorSale });
}
