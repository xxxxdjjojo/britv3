import type { SeriesPoint } from "@/services/metrics/platform-metrics-service";

/**
 * MetricSparkline — tiny inline SVG of one metric's trailing-30-day daily
 * series (TrendSparkline pattern, server-safe: pure SVG, no handlers).
 * Days with no snapshot are rendered as GAPS (the line breaks), never as
 * zeros — a missed nightly run must stay visibly missing.
 */

const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 40;
const PAD_X = 4;
const PAD_Y = 5;

type Recorded = { x: number; y: number; day: string; value: number };

/** Split recorded points into contiguous segments so gaps break the line. */
function segments(points: SeriesPoint[]): Recorded[][] {
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]));
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = (VIEW_WIDTH - PAD_X * 2) / Math.max(points.length - 1, 1);

  const runs: Recorded[][] = [];
  let current: Recorded[] = [];
  points.forEach((p, i) => {
    if (p.value === null) {
      if (current.length > 0) runs.push(current);
      current = [];
      return;
    }
    current.push({
      x: PAD_X + i * step,
      y: PAD_Y + ((max - p.value) / range) * (VIEW_HEIGHT - PAD_Y * 2),
      day: p.day,
      value: p.value,
    });
  });
  if (current.length > 0) runs.push(current);
  return runs;
}

export function MetricSparkline({
  series,
  label,
}: Readonly<{ series: SeriesPoint[]; label: string }>) {
  const runs = segments(series);
  const recordedCount = runs.reduce((n, run) => n + run.length, 0);
  if (recordedCount < 2) return null;

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${label}: last ${series.length} days, ${recordedCount} nightly snapshots`}
      className="mt-3 h-10 w-full"
    >
      {runs.map((run) =>
        run.length === 1 ? (
          <circle
            key={run[0].day}
            cx={run[0].x}
            cy={run[0].y}
            r="1.75"
            fill="var(--color-brand-primary)"
          />
        ) : (
          <polyline
            key={run[0].day}
            points={run.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            fill="none"
            stroke="var(--color-brand-primary)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ),
      )}
    </svg>
  );
}
