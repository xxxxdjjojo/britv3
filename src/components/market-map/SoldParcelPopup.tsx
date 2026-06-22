"use client";

import type { SoldParcel, SoldSale } from "@/lib/market-map/sold-colour";
import { formatPounds, formatPricePerSqm } from "@/lib/market-map/sold-colour";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Formats an ISO "YYYY-MM-DD" date as e.g. "12 Mar 2024". Falls back to the raw string. */
function formatTransferDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const monthLabel = MONTHS[Number(month) - 1];
  if (!monthLabel) return iso;
  return `${Number(day)} ${monthLabel} ${year}`;
}

/** Title-cases a property-type token, e.g. "semi-detached" → "Semi-Detached". */
function formatPropertyType(type: string): string {
  return type
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

const FOOTER = "Sold prices: HM Land Registry. Floor areas: EPC.";

type Props = Readonly<{ parcel: SoldParcel }>;

export function SoldParcelPopup({ parcel }: Props) {
  const isSingle = parcel.saleCount === 1;

  return (
    <div className="min-w-56 max-w-72 text-sm text-neutral-800">
      {isSingle ? (
        <SingleSale sale={parcel.sales[0]} fallbackType={parcel.dominantPropertyType} />
      ) : (
        <MultiSale parcel={parcel} />
      )}
      <p className="mt-3 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
        {FOOTER}
      </p>
    </div>
  );
}

function SingleSale({
  sale,
  fallbackType,
}: Readonly<{ sale: SoldSale | undefined; fallbackType: string }>) {
  if (!sale) return null;

  const ppsqm = formatPricePerSqm(sale.ppsqm);
  const typeLabel = formatPropertyType(sale.type || fallbackType);

  return (
    <div>
      <p className="font-semibold leading-snug text-neutral-900">
        {sale.address ?? "Address withheld"}
      </p>
      <p className="text-xs text-neutral-500">{formatTransferDate(sale.date)}</p>

      <p className="mt-2 text-lg font-bold tracking-tight text-neutral-900">
        {formatPounds(sale.price)}
      </p>

      {ppsqm ? (
        <p className="text-sm text-neutral-600">{ppsqm}</p>
      ) : (
        <p className="text-xs text-neutral-400">Floor area unknown — no £/m²</p>
      )}

      {typeLabel ? (
        <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
          {typeLabel}
        </p>
      ) : null}

      {sale.estimatedLocation ? (
        <p className="mt-1 text-xs text-neutral-400">
          Approx. location (postcode centroid)
        </p>
      ) : null}
    </div>
  );
}

function MultiSale({ parcel }: Readonly<{ parcel: SoldParcel }>) {
  const medianPpsqm = formatPricePerSqm(parcel.medianPricePerSqmPence);

  return (
    <div>
      <p className="font-semibold text-neutral-900">
        {parcel.saleCount} recorded sales on this parcel
      </p>
      <p className="text-xs text-neutral-500">
        Freehold title — a house sold over time, or the flats that share it.
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Median {formatPounds(parcel.medianPricePence)}
        {medianPpsqm ? ` · ${medianPpsqm}` : ""}
      </p>

      {parcel.saleCount > parcel.sales.length ? (
        <p className="mt-1 text-xs text-neutral-400">
          Showing the {parcel.sales.length} most recent of {parcel.saleCount}.
        </p>
      ) : null}

      <ul className="mt-2 max-h-56 divide-y divide-neutral-100 overflow-y-auto">
        {parcel.sales.map((sale, index) => {
          const ppsqm = formatPricePerSqm(sale.ppsqm);
          return (
            <li
              key={`${sale.address ?? "withheld"}-${sale.date}-${index}`}
              className="flex items-baseline justify-between gap-3 py-1.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-neutral-800">
                  {sale.address ?? "Address withheld"}
                </span>
                <span className="block text-xs text-neutral-400">
                  {formatTransferDate(sale.date)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-medium text-neutral-900">
                  {formatPounds(sale.price)}
                </span>
                {ppsqm ? (
                  <span className="block text-xs text-neutral-400">{ppsqm}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
