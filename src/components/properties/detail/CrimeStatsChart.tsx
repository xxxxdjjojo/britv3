"use client";

import { ShieldAlert } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrimeStat = {
  category: string;
  count: number;
};

type Props = Readonly<{
  stats: CrimeStat[] | null;
  boroughAvg?: number | null;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorten long category labels so they fit on the axis. */
function shortenCategory(cat: string): string {
  return cat
    .replace("Anti-social behaviour", "ASB")
    .replace("Vehicle crime", "Vehicle")
    .replace("Criminal damage and arson", "Damage/Arson")
    .replace("Other theft", "Other theft")
    .replace("Public order", "Public order")
    .replace("Possession of weapons", "Weapons");
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{payload[0]?.value} incidents</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrimeStatsChart({ stats, boroughAvg }: Props) {
  // Graceful absence: render nothing when there is no data to show.
  if (!stats || stats.length === 0) {
    return null;
  }

  const chartData = stats.map((s) => ({
    name: shortenCategory(s.category),
    count: s.count,
  }));

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">Crime Statistics</p>
        </div>
        {boroughAvg != null && (
          <span className="text-xs text-muted-foreground">
            Borough avg: {boroughAvg} / category
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={48}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            {boroughAvg != null && (
              <ReferenceLine
                y={boroughAvg}
                stroke="hsl(var(--brand-secondary, 212 76 100))"
                strokeDasharray="4 4"
                label={{
                  value: "Avg",
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            )}
            <Bar
              dataKey="count"
              fill="var(--color-brand-primary)"
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Data sourced from Police UK open data. Figures represent the most recent
        12-month period.
      </p>
    </div>
  );
}
