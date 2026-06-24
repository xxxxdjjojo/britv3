"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";

type Props = Readonly<{
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
}>;

const NEEDS = "#1B4D3E";
const WANTS = "#2D7A5F";
const SAVINGS = "#A07D2E";

const chartConfig = {
  value: { label: "Share of net income" },
} satisfies ChartConfig;

export function BudgetSplitBar({ needsPercent, wantsPercent, savingsPercent }: Props) {
  const data = [
    { name: "Needs", value: Math.min(Math.round(needsPercent), 100), fill: NEEDS },
    { name: "Wants", value: Math.round(wantsPercent), fill: WANTS },
    { name: "Savings", value: Math.round(savingsPercent), fill: SAVINGS },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4 text-primary" />
          50/30/20 budget rule
        </CardTitle>
        <CardDescription>How your spending compares to the popular framework</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-32 w-full">
          <BarChart data={data} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={64} />
            <Tooltip
              formatter={(v: number) => `${Math.round(v)}%`}
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary">Needs (target 50%)</p>
            <p className="text-lg font-bold text-primary">{Math.round(needsPercent)}%</p>
          </div>
          <div className="rounded-lg border border-brand-primary-light/20 bg-brand-primary-light/10 p-3">
            <p className="text-xs font-medium text-brand-primary-light">Wants (target 30%)</p>
            <p className="text-lg font-bold text-brand-primary-light">{Math.round(wantsPercent)}%</p>
          </div>
          <div className="rounded-lg border border-brand-secondary/20 bg-brand-secondary/10 p-3">
            <p className="text-xs font-medium text-brand-secondary">Savings (target 20%)</p>
            <p className="text-lg font-bold text-brand-secondary">{Math.round(savingsPercent)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
