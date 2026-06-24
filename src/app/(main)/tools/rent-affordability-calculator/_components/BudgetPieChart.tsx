"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";
import type { BudgetSlice } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";

type Props = Readonly<{ slices: readonly BudgetSlice[] }>;

// Green-anchored palette (gold accent for savings, soft green for leftover).
// Explicit brand hexes — never the blue --chart-N tokens.
const chartConfig = {
  rent: { label: "Rent", color: "#1B4D3E" },
  utilities: { label: "Utilities", color: "#2D7A5F" },
  debts: { label: "Debts", color: "#003629" },
  expenses: { label: "Other expenses", color: "#5E8C78" },
  savings: { label: "Savings", color: "#A07D2E" },
  leftover: { label: "Leftover", color: "#C9E3D5" },
} satisfies ChartConfig;

export function BudgetPieChart({ slices }: Props) {
  const data = slices.filter((s) => s.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="size-4 text-primary" />
          Budget breakdown
        </CardTitle>
        <CardDescription>Where your monthly net income goes</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Enter your income and costs to see your breakdown.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-64">
            <PieChart>
              <Pie
                data={data as BudgetSlice[]}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((slice) => (
                  <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatGBP(value)}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
