"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type GapBarChartProps = Readonly<{
  rows: ReadonlyArray<{ label: string; value: number }>;
  valueSuffix?: string;
  className?: string;
}>;

const BAR_HEIGHT = 44;
const MIN_CHART_HEIGHT = 160;
const BRAND_FILL = "var(--color-brand-primary)";
const HOVER_CURSOR_FILL = "var(--color-brand-primary-lighter)";

/**
 * Horizontal bar chart for regional gap tables. Client child fed plain props
 * by server report pages, following the AreaPriceTrend conventions
 * (ResponsiveContainer, brand-green fills via CSS vars).
 */
export function GapBarChart({ rows, valueSuffix = "", className }: GapBarChartProps) {
  const data = rows.map((row) => ({ label: row.label, value: row.value }));
  const height = Math.max(MIN_CHART_HEIGHT, rows.length * BAR_HEIGHT);
  const formatValue = (value: number) =>
    `${value.toLocaleString("en-GB")}${valueSuffix}`;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatValue}
            tick={{ fontSize: 10, fill: "#9E9EAB", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={128}
            tick={{ fontSize: 11, fill: "#4B4B57", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), "Value"]}
            cursor={{ fill: HOVER_CURSOR_FILL }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E2E2E8",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="value"
            fill={BRAND_FILL}
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
