"use client";

import { useState } from "react";

export type SdltCalculatorProps = Readonly<{
  initialPrice?: number;
  initialIsFirstTimeBuyer?: boolean;
  className?: string;
}>;

type Band = Readonly<{ from: number; to: number; rate: number }>;

const STANDARD_BANDS: Band[] = [
  { from: 0, to: 250_000, rate: 0 },
  { from: 250_000, to: 925_000, rate: 5 },
  { from: 925_000, to: 1_500_000, rate: 10 },
  { from: 1_500_000, to: Infinity, rate: 12 },
];

// First-time buyer relief (England/NI, from Oct 2024)
// 0% up to £425k, 5% £425k–£625k, no relief above £625k
const FTB_BANDS: Band[] = [
  { from: 0, to: 425_000, rate: 0 },
  { from: 425_000, to: 625_000, rate: 5 },
];

function calcSdlt(price: number, bands: Band[]): number {
  // Above FTB threshold, use standard bands instead
  if (bands === FTB_BANDS && price > 625_000) {
    return calcSdlt(price, STANDARD_BANDS);
  }
  return bands.reduce((total, band) => {
    if (price <= band.from) return total;
    const taxable = Math.min(price, band.to === Infinity ? price : band.to) - band.from;
    return total + taxable * (band.rate / 100);
  }, 0);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function SdltCalculator({
  initialPrice = 0,
  initialIsFirstTimeBuyer = false,
  className,
}: SdltCalculatorProps) {
  const [propertyPrice, setPropertyPrice] = useState(initialPrice);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(
    initialIsFirstTimeBuyer,
  );
  const [isAdditionalProperty, setIsAdditionalProperty] = useState(false);

  const bands = isFirstTimeBuyer ? FTB_BANDS : STANDARD_BANDS;
  let sdlt = calcSdlt(propertyPrice, bands);

  // Additional property surcharge: +3% on all bands (flat)
  if (isAdditionalProperty && propertyPrice > 0) {
    sdlt += propertyPrice * 0.03;
  }

  const effectiveRate = propertyPrice > 0 ? (sdlt / propertyPrice) * 100 : 0;

  const displayBands =
    isFirstTimeBuyer && propertyPrice <= 625_000 ? FTB_BANDS : STANDARD_BANDS;

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Property price */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Property price
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              £
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="block w-full rounded-lg border border-neutral-300 py-2 pl-7 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Buyer type toggles */}
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isFirstTimeBuyer}
              onChange={(e) => {
                setIsFirstTimeBuyer(e.target.checked);
                if (e.target.checked) setIsAdditionalProperty(false);
              }}
              className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
            />
            <span className="text-sm text-neutral-700">First-time buyer</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isAdditionalProperty}
              onChange={(e) => {
                setIsAdditionalProperty(e.target.checked);
                if (e.target.checked) setIsFirstTimeBuyer(false);
              }}
              className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
            />
            <span className="text-sm text-neutral-700">
              Additional property (+3% surcharge)
            </span>
          </label>
        </div>
      </div>

      {/* Result */}
      {propertyPrice > 0 && (
        <div className="mt-5 rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Stamp Duty (SDLT)
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-900">
            {formatCurrency(sdlt)}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Effective rate: {formatPercent(effectiveRate)}
          </p>

          {/* Band breakdown */}
          <div className="mt-4 space-y-1">
            {displayBands.map((band) => {
              if (propertyPrice <= band.from) return null;
              const taxable =
                Math.min(propertyPrice, band.to === Infinity ? propertyPrice : band.to) -
                band.from;
              const tax = taxable * (band.rate / 100);
              return (
                <div
                  key={band.from}
                  className="flex justify-between text-xs text-amber-800"
                >
                  <span>
                    {formatCurrency(band.from)} –{" "}
                    {band.to === Infinity ? "above" : formatCurrency(band.to)} @{" "}
                    {band.rate}%
                  </span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
              );
            })}
            {isAdditionalProperty && (
              <div className="flex justify-between text-xs text-amber-800">
                <span>Additional property surcharge @ 3%</span>
                <span className="font-medium">
                  {formatCurrency(propertyPrice * 0.03)}
                </span>
              </div>
            )}
          </div>

          {isFirstTimeBuyer && propertyPrice <= 625_000 && (
            <p className="mt-3 text-xs text-amber-700">
              First-time buyer relief applied. Threshold: £425,000.
            </p>
          )}
          {isFirstTimeBuyer && propertyPrice > 625_000 && (
            <p className="mt-3 text-xs text-amber-700">
              No first-time buyer relief — property price exceeds £625,000 cap.
              Standard rates applied.
            </p>
          )}
          <p className="mt-3 text-xs text-neutral-400">
            England &amp; Northern Ireland rates. Different rates apply in Scotland (LBTT)
            and Wales (LTT). Indicative only — seek professional advice.
          </p>
        </div>
      )}
    </div>
  );
}
