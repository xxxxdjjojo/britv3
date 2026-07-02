"use client";

/**
 * TrendSparkline — tiny inline SVG of monthly median sold prices for a
 * postcode sector, from real PPD rows only. Self-gating: renders nothing when
 * the trend is insufficient (< 30 sales/12mo, decided server-side) or when
 * fewer than two months have sales. Dots are sized by each month's sale count
 * so small-sample months are visibly less certain. No new dependencies.
 */

import type { SectorTrend } from "@/services/truedeed/ppd-postcode-service";

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 64;
const PAD_X = 6;
const PAD_Y = 8;
/** Months with at least this many sales get the full-size dot. */
const SOLID_SAMPLE_THRESHOLD = 5;

/** "2026-03" → months since year 0, for honest x-spacing across gap months. */
function monthIndex(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return year * 12 + (mon - 1);
}

function formatPounds(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

function formatMonth(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function TrendSparkline({ trend }: Readonly<{ trend: SectorTrend }>) {
  if (trend.insufficient || trend.months.length < 2 || !trend.sector) return null;

  const months = trend.months;
  const first = monthIndex(months[0].month);
  const last = monthIndex(months[months.length - 1].month);
  const span = Math.max(last - first, 1);
  const medians = months.map((m) => m.median);
  const min = Math.min(...medians);
  const max = Math.max(...medians);
  const range = Math.max(max - min, 1);

  const points = months.map((m) => ({
    x: PAD_X + ((monthIndex(m.month) - first) / span) * (VIEW_WIDTH - PAD_X * 2),
    y: PAD_Y + ((max - m.median) / range) * (VIEW_HEIGHT - PAD_Y * 2),
    month: m,
  }));
  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const latest = months[months.length - 1];

  return (
    <figure
      aria-label={`12-month sold-price trend for ${trend.sector}`}
      className="rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)]"
    >
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-brand-primary">
        Monthly median · {trend.sector} sector
      </p>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={`Monthly median sold prices from ${formatMonth(months[0].month)} to ${formatMonth(latest.month)}. Latest month median ${formatPounds(latest.median)} from ${latest.count} sales.`}
        className="mt-3 h-16 w-full"
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-brand-primary)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle
            key={p.month.month}
            cx={p.x}
            cy={p.y}
            r={p.month.count >= SOLID_SAMPLE_THRESHOLD ? 3 : 2}
            fill={
              p.month.count >= SOLID_SAMPLE_THRESHOLD
                ? "var(--color-brand-primary)"
                : "white"
            }
            stroke="var(--color-brand-primary)"
            strokeWidth="1.25"
          >
            <title>{`${formatMonth(p.month.month)}: median ${formatPounds(p.month.median)} (${p.month.count} ${p.month.count === 1 ? "sale" : "sales"})`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="mt-2.5 font-sans text-xs leading-relaxed text-brand-primary-dark/55">
        12-month sold-price trend for {trend.sector} · {trend.totalCount.toLocaleString("en-GB")}{" "}
        sales. Each point is that month&apos;s median sold price; hollow dots mark months with
        fewer than {SOLID_SAMPLE_THRESHOLD} sales.
      </figcaption>
    </figure>
  );
}
