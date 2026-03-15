"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import type { CompetitorAgentData } from "@/services/agent/agent-analytics-service";

type AreaPriceTrend = {
  month: string;
  avg_price: number;
};

type Props = Readonly<{
  coverageAreas: string[];
  initialArea: string;
  competitors: CompetitorAgentData[];
  agentListingCount: number;
  priceTrend: AreaPriceTrend[];
}>;

type CompetitorRow = CompetitorAgentData & {
  market_share_pct: number;
};

const columnHelper = createColumnHelper<CompetitorRow>();

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatMonth(iso: string): string {
  try {
    const [year, month] = iso.split("-");
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" }).format(
      new Date(Number(year), Number(month) - 1, 1),
    );
  } catch {
    return iso;
  }
}

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316",
];

export function CompetitorAnalysis({
  coverageAreas,
  initialArea,
  competitors,
  agentListingCount,
  priceTrend,
}: Props) {
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [rows, setRows] = useState<CompetitorRow[]>(
    buildRows(competitors, agentListingCount),
  );
  const [trend, setTrend] = useState<AreaPriceTrend[]>(priceTrend);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "listing_count", desc: true },
  ]);

  function buildRows(
    comps: CompetitorAgentData[],
    myCount: number,
  ): CompetitorRow[] {
    const total = comps.reduce((acc, c) => acc + c.listing_count, 0) + myCount;
    return comps.map((c) => ({
      ...c,
      market_share_pct: total > 0 ? (c.listing_count / total) * 100 : 0,
    }));
  }

  async function handleAreaChange(area: string) {
    setSelectedArea(area);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/agent/analytics?type=competitor&area=${encodeURIComponent(area)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as CompetitorAgentData[];
        setRows(buildRows(data, agentListingCount));
      }
      // Fetch price trend (appraisal for avg price data)
      const trendRes = await fetch(
        `/api/agent/analytics?type=appraisal&postcode=${encodeURIComponent(area)}`,
      );
      if (trendRes.ok) {
        // appraisal returns a single data point — we keep existing trend for now
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }

  const mySharePct =
    rows.length > 0
      ? (agentListingCount /
          (rows.reduce((a, c) => a + c.listing_count, 0) + agentListingCount)) *
        100
      : 100;

  // Market share bar chart data — include "You" as first entry
  const shareChartData = [
    { name: "You", share: Math.round(mySharePct * 10) / 10, listings: agentListingCount },
    ...rows.slice(0, 7).map((r, i) => ({
      name: `Agency ${i + 1}`,
      share: Math.round(r.market_share_pct * 10) / 10,
      listings: r.listing_count,
    })),
  ];

  const trendChartData = trend.map((t) => ({
    date: formatMonth(t.month),
    price: Math.round(t.avg_price / 100),
  }));

  const columns = [
    columnHelper.accessor("agent_id", {
      header: "Agency",
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">
          {info.getValue().slice(0, 8)}…
        </span>
      ),
    }),
    columnHelper.accessor("listing_count", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Active Listings <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("avg_price_pence", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Avg Price <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: (info) => formatGbp(info.getValue()),
    }),
    columnHelper.accessor("avg_time_on_market_days", {
      header: "Avg Days",
      cell: (info) => {
        const v = info.getValue();
        return v != null ? `${v} days` : "—";
      },
    }),
    columnHelper.accessor("market_share_pct", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Est. Market Share <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: (info) => `${info.getValue().toFixed(1)}%`,
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Area selector */}
      {coverageAreas.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" htmlFor="area-select">
            Area:
          </label>
          <select
            id="area-select"
            value={selectedArea}
            onChange={(e) => void handleAreaChange(e.target.value)}
            disabled={loading}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {coverageAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
        Competitor data is derived from publicly listed properties and does not include private agency data.
        Market share estimates are based on active listing counts in the selected area.
      </p>

      {/* Competitor table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Competing Agencies</CardTitle>
          <CardDescription>Active listings and market metrics for agencies in {selectedArea || "your area"}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No competitor data found for this area
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="py-2 px-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-2 px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Market share bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Market Share Comparison</CardTitle>
            <CardDescription>Your share vs top competitors (by listing count)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shareChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`, "Market Share"]}
                />
                <Bar dataKey="share" radius={[3, 3, 0, 0]}>
                  {shareChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === "You" ? "#3b82f6" : CHART_COLORS[(index) % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Area avg price trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Area Price Trend</CardTitle>
            <CardDescription>Average listing price over 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {trendChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No price trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [`£${v.toLocaleString()}`, "Avg Price"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Avg Price (£)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
