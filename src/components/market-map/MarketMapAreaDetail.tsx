/**
 * MarketMapAreaDetail — selected-area detail card per DESIGN.md §9.
 *
 * Shows: area name, median price, P10/P90 range, transaction count,
 * latest transaction date, confidence badge, scale, and the mandatory disclaimer.
 */

import { cn } from "@/lib/utils";
import { MarketMapDisclaimer } from "./MarketMapDisclaimer";
import type { MarketMapFeatureProperties } from "@/services/market-map/types";
import type { MarketMapScaleMode } from "@/services/market-map/types";

type Props = Readonly<{
  properties: MarketMapFeatureProperties;
  scaleMode: MarketMapScaleMode;
  onClose?: () => void;
  className?: string;
}>;

function formatPrice(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CONFIDENCE_STYLES: Record<
  string,
  { dot: string; text: string }
> = {
  High: { dot: "bg-[#16A34A]", text: "text-[#16A34A]" },
  Medium: { dot: "bg-[#CA8A04]", text: "text-[#CA8A04]" },
  Low: { dot: "bg-[#7A7A88]", text: "text-[#7A7A88]" },
  Insufficient: { dot: "bg-[#9E9EAB]", text: "text-[#9E9EAB]" },
};

function DetailRow({
  label,
  value,
  valueClassName,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-sans text-xs text-[#7A7A88]">{label}</span>
      <span className={cn("font-sans text-xs font-medium text-[#2E2E33]", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

export function MarketMapAreaDetail({
  properties,
  scaleMode,
  onClose,
  className,
}: Props) {
  const {
    area_name,
    median_price,
    p10_price,
    p90_price,
    transaction_count,
    latest_transaction_date,
    confidence,
    date_from,
    date_to,
    property_type_mix,
  } = properties;

  const confStyle = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.Insufficient;
  const isInsufficient = confidence === "Insufficient";

  // Property type mix — sort desc, show top 4
  const mixEntries = Object.entries(property_type_mix ?? {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const totalMix = mixEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div
      className={cn(
        "w-full max-w-xs rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)]",
        className,
      )}
      role="region"
      aria-label={`Area detail: ${area_name ?? properties.area_id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#E2E2E8] px-4 py-3">
        <p className="font-heading text-sm font-bold text-[#003629]">
          {area_name ?? properties.area_id}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close area detail"
            className={cn(
              "shrink-0 rounded p-0.5 text-[#7A7A88]",
              "hover:bg-[#F1F1F5] hover:text-[#2E2E33]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]",
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Median price — hero value */}
      <div className="border-b border-[#E2E2E8] px-4 py-3">
        <p className="font-sans text-xs text-[#7A7A88]">Median sold price</p>
        <p className="mt-0.5 font-heading text-xl font-bold text-[#003629]">
          {isInsufficient ? "—" : formatPrice(median_price)}
        </p>
      </div>

      {/* Detail rows */}
      <div className="flex flex-col gap-2.5 border-b border-[#E2E2E8] px-4 py-3">
        <DetailRow
          label="Transactions"
          value={transaction_count.toLocaleString("en-GB")}
        />
        <DetailRow
          label="Period"
          value={
            date_from && date_to
              ? `${formatDate(date_from)} – ${formatDate(date_to)}`
              : "—"
          }
        />
        <DetailRow
          label="Scale"
          value={scaleMode === "national" ? "National" : "Local"}
        />
        <DetailRow
          label="Confidence"
          value={
            <span className="flex items-center gap-1.5">
              <span
                className={cn("inline-block h-2 w-2 rounded-full", confStyle.dot)}
                aria-hidden="true"
              />
              <span className={cn("font-medium", confStyle.text)}>{confidence}</span>
            </span>
          }
        />
        {latest_transaction_date && (
          <DetailRow
            label="Latest sale"
            value={formatDate(latest_transaction_date)}
          />
        )}
      </div>

      {/* P10–P90 range */}
      {!isInsufficient && (
        <div className="border-b border-[#E2E2E8] px-4 py-3">
          <p className="font-sans text-xs text-[#7A7A88]">
            Price range (P10 – P90)
          </p>
          <p className="mt-1 font-sans text-sm font-bold text-[#003629]">
            {formatPrice(p10_price)}{" "}
            <span className="font-normal text-[#C4C4CE]">——</span>{" "}
            {formatPrice(p90_price)}
          </p>
        </div>
      )}

      {/* Property type mix */}
      {mixEntries.length > 0 && (
        <div className="border-b border-[#E2E2E8] px-4 py-3">
          <p className="mb-2 font-sans text-xs text-[#7A7A88]">
            Property type mix
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {mixEntries.map(([type, count]) => (
              <span key={type} className="font-sans text-xs text-[#2E2E33]">
                <span className="font-medium capitalize">{type}</span>{" "}
                <span className="text-[#7A7A88]">
                  {totalMix > 0
                    ? `${Math.round((count / totalMix) * 100)}%`
                    : "—"}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 py-3">
        <p className="mb-1 font-sans text-[10px] font-bold text-[#7A7A88]">
          ⓘ
        </p>
        <MarketMapDisclaimer />
      </div>
    </div>
  );
}
