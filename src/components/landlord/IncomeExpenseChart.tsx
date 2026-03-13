"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// -- Types --------------------------------------------------------------------

export type MonthlyDataPoint = Readonly<{
  month: string; // e.g. "Jan 2026"
  income: number;
  expenses: number;
  net: number;
}>;

export type CategoryDataPoint = Readonly<{
  category: string;
  amount: number;
}>;

// -- IncomeExpenseTrendChart --------------------------------------------------

/**
 * Area chart showing monthly income vs expenses over the last 12 months.
 * Uses Britestate brand colours: #1B4D3E (income) and #D4A853 (expenses).
 */
export function IncomeExpenseTrendChart(
  props: Readonly<{ data: MonthlyDataPoint[] }>,
) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={props.data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v: number) =>
            v === 0 ? "£0" : `£${(v / 1000).toFixed(0)}K`
          }
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          formatter={(v: number, name: string) => [
            `£${Number(v).toLocaleString("en-GB")}`,
            name === "income" ? "Income" : "Expenses",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          name="income"
          stroke="#1B4D3E"
          fill="#1B4D3E"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name="expenses"
          stroke="#D4A853"
          fill="#D4A853"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// -- ExpenseCategoryChart ----------------------------------------------------

/**
 * Bar chart showing expense total grouped by category.
 */
export function ExpenseCategoryChart(
  props: Readonly<{ data: CategoryDataPoint[] }>,
) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={props.data}
        margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          angle={-25}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) =>
            v === 0 ? "£0" : `£${v.toLocaleString("en-GB")}`
          }
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          formatter={(v: number) => [
            `£${Number(v).toLocaleString("en-GB")}`,
            "Amount",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            fontSize: 12,
          }}
        />
        <Bar dataKey="amount" fill="#1B4D3E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
