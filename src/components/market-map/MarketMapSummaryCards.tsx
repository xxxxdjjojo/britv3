/**
 * MarketMapSummaryCards — "Market Insight" card row per DESIGN.md §6.
 *
 * Shows: selected area name, median sold price, transaction count,
 * confidence badge, and data period.
 *
 * Accepts undefined/null to render skeleton state.
 */

import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/lib/market-map/confidence";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SummaryCardData = {
  areaName: string | null;
  medianPrice: number | null;
  transactionCount: number | null;
  confidence: ConfidenceLevel | null;
  periodFrom: string | null;
  periodTo: string | null;
};

type Props = Readonly<{
  data: SummaryCardData | null;
  className?: string;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const CONFIDENCE_STYLES: Record<
  ConfidenceLevel,
  { dot: string; label: string; text: string }
> = {
  High: {
    dot: "bg-[#16A34A]",
    label: "High",
    text: "text-[#16A34A]",
  },
  Medium: {
    dot: "bg-[#CA8A04]",
    label: "Medium",
    text: "text-[#CA8A04]",
  },
  Low: {
    dot: "bg-[#7A7A88]",
    label: "Low",
    text: "text-[#7A7A88]",
  },
  Insufficient: {
    dot: "bg-[#9E9EAB]",
    label: "Insufficient",
    text: "text-[#9E9EAB]",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CardRow({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#858593]">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Divider() {
  return <hr className="border-t border-[#E2E2E8]" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketMapSummaryCards({ data, className }: Props) {
  if (!data) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-xl)] bg-[#F1F1F5] p-4",
          className,
        )}
      >
        <p className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#858593]">
          Market Insight
        </p>
        <p className="mt-2 font-sans text-xs text-[#7A7A88]">
          Click an area on the map to see price data.
        </p>
      </div>
    );
  }

  const {
    areaName,
    medianPrice,
    transactionCount,
    confidence,
    periodFrom,
    periodTo,
  } = data;

  const confidenceStyle = confidence ? CONFIDENCE_STYLES[confidence] : null;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] bg-[#F1F1F5] p-4",
        className,
      )}
      aria-label="Market insight summary"
    >
      <p className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#858593]">
        Market Insight
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {/* Area */}
        {areaName && (
          <>
            <CardRow label="Area">
              <p className="font-heading text-lg font-bold text-[#003629]">
                {areaName}
              </p>
            </CardRow>
            <Divider />
          </>
        )}

        {/* Median price */}
        <CardRow label="Median price">
          <p className="font-heading text-lg font-bold text-[#003629]">
            {medianPrice != null ? formatPrice(medianPrice) : "—"}
          </p>
        </CardRow>

        <Divider />

        {/* Transactions */}
        <CardRow label="Transactions">
          <p className="font-heading text-lg font-bold text-[#003629]">
            {transactionCount != null
              ? transactionCount.toLocaleString("en-GB")
              : "—"}
          </p>
        </CardRow>

        <Divider />

        {/* Confidence */}
        <CardRow label="Confidence">
          {confidenceStyle ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2.5 w-2.5 rounded-full",
                  confidenceStyle.dot,
                )}
                aria-hidden="true"
              />
              <p
                className={cn(
                  "font-heading text-lg font-bold",
                  confidenceStyle.text,
                )}
              >
                {confidenceStyle.label}
              </p>
            </div>
          ) : (
            <p className="font-heading text-lg font-bold text-[#7A7A88]">—</p>
          )}
        </CardRow>

        <Divider />

        {/* Period */}
        <CardRow label="Period">
          <p className="font-sans text-sm font-medium text-[#2E2E33]">
            {periodFrom && periodTo
              ? `${formatDate(periodFrom)} – ${formatDate(periodTo)}`
              : "—"}
          </p>
        </CardRow>
      </div>
    </div>
  );
}
