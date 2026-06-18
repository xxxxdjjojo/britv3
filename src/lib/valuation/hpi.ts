/**
 * House Price Index time-adjustment. Comparable sales are restated to the
 * valuation date using a property-price index:
 *
 *   adjusted = historic_price × index_at(valuation_date) ÷ index_at(sale_date)
 *
 * Index source: UK House Price Index (gov.uk, Open Government Licence). The
 * series is a step function keyed by "YYYY-MM"; values are held flat to the most
 * recent available month at or before a given date.
 */

export type HpiPoint = Readonly<{ month: string; index: number }>;

function monthOf(date: string): string {
  // Accepts "YYYY-MM" or "YYYY-MM-DD" (ISO month strings sort lexicographically).
  return date.slice(0, 7);
}

/** Index value at a date, clamped to the series bounds (step function). */
export function indexAt(series: readonly HpiPoint[], date: string): number {
  if (series.length === 0) throw new Error("hpi: empty series");
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  const target = monthOf(date);

  if (target <= sorted[0].month) return sorted[0].index;
  const last = sorted[sorted.length - 1];
  if (target >= last.month) return last.index;

  let chosen = sorted[0].index;
  for (const point of sorted) {
    if (point.month <= target) chosen = point.index;
    else break;
  }
  return chosen;
}

/** Restate a historic sale price to the valuation date using the index. */
export function timeAdjustPrice(
  price: number,
  saleDate: string,
  valuationDate: string,
  series: readonly HpiPoint[],
): number {
  const atSale = indexAt(series, saleDate);
  const atValuation = indexAt(series, valuationDate);
  if (atSale <= 0) return price; // defensive: never divide by a bad index
  return Math.round(price * (atValuation / atSale));
}
