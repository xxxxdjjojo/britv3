"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type QuarterData = Readonly<{
  quarter: string;
  newListings: number;
  soldVolume: number;
}>;

type ListingVolumeProps = Readonly<{
  data?: QuarterData[];
  className?: string;
}>;

const DEFAULT_DATA: QuarterData[] = [
  { quarter: "Q1 25", newListings: 84, soldVolume: 68 },
  { quarter: "Q2 25", newListings: 96, soldVolume: 77 },
  { quarter: "Q3 25", newListings: 112, soldVolume: 89 },
  { quarter: "Q4 25", newListings: 78, soldVolume: 71 },
  { quarter: "Q1 26", newListings: 91, soldVolume: 74 },
];

export function ListingVolume({ data = DEFAULT_DATA, className }: ListingVolumeProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="quarter"
            tick={{ fontSize: 10, fill: "var(--color-neutral-400)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "var(--color-neutral-400)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-neutral-200)", fontSize: 12 }} />
          <Legend
            iconType="square"
            iconSize={10}
            formatter={(value) =>
              value === "newListings" ? "New Listings" : "Sold Volume"
            }
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="newListings" fill="var(--color-brand-primary)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="soldVolume" fill="var(--color-brand-primary-light)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
