/**
 * MarketMapPriceCard — instant Flat/House headline price card.
 *
 * Presentational: renders two bands (Flats / Houses) straight from the
 * precomputed area card. Each band shows the median (or an explicit
 * "Insufficient sales" label — never £0/£null), the P10–P90 range, and a
 * 3-dot confidence index. Shows a skeleton placeholder while loading.
 */

import { cn } from "@/lib/utils";
import type {
  MarketAreaCard,
  MarketCardSeries,
} from "@/services/market-map/area-detail-service";

type Props = Readonly<{
  card: MarketAreaCard | undefined;
  areaName: string;
  isLoading?: boolean;
  /** Optional per-band caption, e.g. "Based on 42 sales in this postcode district". */
  subtitles?: Readonly<{ flat?: string | null; house?: string | null }>;
}>;

const CONFIDENCE_DOTS: Record<MarketCardSeries["confidence"], number> = {
  High: 3,
  Medium: 2,
  Low: 1,
  Insufficient: 0,
};

const TOTAL_DOTS = 3;

function formatPrice(pounds: number): string {
  return `£${pounds.toLocaleString("en-GB")}`;
}

function ConfidenceDots({ filled }: Readonly<{ filled: number }>) {
  return (
    <span
      className="flex items-center gap-1"
      aria-label={`Confidence ${filled} of ${TOTAL_DOTS}`}
    >
      {Array.from({ length: TOTAL_DOTS }, (_, i) => {
        const isFilled = i < filled;
        return (
          <span
            key={i}
            data-testid={isFilled ? "confidence-dot-filled" : "confidence-dot-hollow"}
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              isFilled
                ? "bg-brand-primary"
                : "border border-brand-primary/30 bg-transparent",
            )}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}

function PriceBand({
  label,
  series,
  testId,
  subtitle,
}: Readonly<{
  label: string;
  series: MarketCardSeries;
  testId: string;
  subtitle?: string | null;
}>) {
  const filledDots = CONFIDENCE_DOTS[series.confidence] ?? 0;

  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-brand-primary-lighter/40 px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-xs font-medium text-brand-primary">
          {label}
        </span>
        <ConfidenceDots filled={filledDots} />
      </div>

      {series.insufficient || series.median === null ? (
        <span className="font-sans text-sm font-semibold text-muted-foreground">
          Insufficient sales
        </span>
      ) : (
        <>
          <span className="font-heading text-lg font-bold text-brand-primary-dark">
            {formatPrice(series.median)}
          </span>
          {series.p10 !== null && series.p90 !== null && (
            <span className="font-sans text-[11px] text-muted-foreground">
              {formatPrice(series.p10)}–{formatPrice(series.p90)}
            </span>
          )}
          {subtitle && (
            <span className="font-sans text-[11px] leading-snug text-muted-foreground">
              {subtitle}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div
      data-testid="price-card-skeleton"
      className="flex flex-col gap-2"
      aria-hidden="true"
    >
      <div className="h-16 animate-pulse rounded-[var(--radius-md)] bg-brand-primary-lighter/60" />
      <div className="h-16 animate-pulse rounded-[var(--radius-md)] bg-brand-primary-lighter/60" />
    </div>
  );
}

export function MarketMapPriceCard({ card, areaName, isLoading, subtitles }: Props) {
  return (
    <div
      className="flex w-full max-w-xs flex-col gap-2 rounded-[var(--radius-lg)] bg-white p-3 shadow-[var(--shadow-lg)]"
      role="region"
      aria-label={`Prices: ${areaName}`}
    >
      <p className="px-1 font-heading text-sm font-bold text-brand-primary-dark">
        {areaName}
      </p>

      {isLoading || !card ? (
        <Skeleton />
      ) : (
        <>
          <PriceBand
            label="Flats"
            series={card.flat}
            testId="price-card-band-flat"
            subtitle={subtitles?.flat}
          />
          <PriceBand
            label="Houses"
            series={card.house}
            testId="price-card-band-house"
            subtitle={subtitles?.house}
          />
        </>
      )}
    </div>
  );
}
