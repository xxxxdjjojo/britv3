"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
import { TrendingUp, Clock, PoundSterling, Percent, Star, ArrowUpDown } from "lucide-react";
import type { AgentPerformanceReport } from "@/services/agent/agent-analytics-service";
import type { AgentBranch, AgentTeamMember } from "@/types/agent";

type TeamMemberRow = {
  id: string;
  name: string;
  role: string;
  leads_assigned: number;
  viewings_conducted: number;
  deals_closed: number;
  revenue_pence: number;
  conversion_rate: number;
};

type Props = Readonly<{
  branches: AgentBranch[];
  initialBranchId: string;
  initialReport: AgentPerformanceReport;
  teamMembers: AgentTeamMember[];
  agencyAvg: AgentPerformanceReport;
}>;

const columnHelper = createColumnHelper<TeamMemberRow>();

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? "+" : ""}{value > 1000 ? formatGbp(value) : value.toFixed(1)}
        {Math.abs(value) <= 100 && "%"}
      </span>
      <span className="text-xs text-muted-foreground">vs agency avg</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function BranchPerformanceCharts({
  branches,
  initialBranchId,
  initialReport,
  teamMembers,
  agencyAvg,
}: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  const [report, setReport] = useState<AgentPerformanceReport>(initialReport);
  const [members] = useState<AgentTeamMember[]>(teamMembers);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "deals_closed", desc: true },
  ]);

  async function handleBranchChange(branchId: string) {
    setSelectedBranchId(branchId);
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/analytics?type=branch&branch_id=${branchId}`);
      if (res.ok) {
        const data = (await res.json()) as AgentPerformanceReport;
        setReport(data);
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }

  // Build team member rows (illustrative — use members list with zero counts since
  // per-member metrics require a separate service call not yet wired)
  const teamRows: TeamMemberRow[] = members.map((m) => ({
    id: m.id,
    name: m.name ?? m.email ?? "Unknown",
    role: m.role,
    leads_assigned: 0,
    viewings_conducted: 0,
    deals_closed: 0,
    revenue_pence: 0,
    conversion_rate: 0,
  }));

  // Team comparison bar chart data
  const teamChartData = teamRows.map((r) => ({
    name: r.name.split(" ")[0], // First name only for chart
    leads: r.leads_assigned,
    viewings: r.viewings_conducted,
    deals: r.deals_closed,
  }));

  const columns = [
    columnHelper.accessor("name", {
      header: "Member",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: (info) => (
        <span className="capitalize text-muted-foreground text-sm">
          {info.getValue().replace(/_/g, " ")}
        </span>
      ),
    }),
    columnHelper.accessor("leads_assigned", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Leads <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("viewings_conducted", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Viewings <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("deals_closed", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Deals Closed <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("revenue_pence", {
      header: "Revenue",
      cell: (info) => formatGbp(info.getValue()),
    }),
    columnHelper.accessor("conversion_rate", {
      header: "Conv. Rate",
      cell: (info) => `${(info.getValue() * 100).toFixed(1)}%`,
    }),
  ];

  const table = useReactTable({
    data: teamRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const kpiCards = [
    {
      label: "Listings Sold",
      value: report.listings_sold_count.toLocaleString(),
      icon: <TrendingUp className="size-5 text-blue-500" />,
      color: "text-blue-600",
    },
    {
      label: "Avg Time on Market",
      value: report.avg_time_on_market_days != null ? `${report.avg_time_on_market_days} days` : "—",
      icon: <Clock className="size-5 text-amber-500" />,
      color: "text-amber-600",
    },
    {
      label: "Total Revenue",
      value: formatGbp(report.total_revenue_pence),
      icon: <PoundSterling className="size-5 text-green-500" />,
      color: "text-green-600",
    },
    {
      label: "Conversion Rate",
      value: `${(report.conversion_rate * 100).toFixed(1)}%`,
      icon: <Percent className="size-5 text-purple-500" />,
      color: "text-purple-600",
    },
    {
      label: "Client Satisfaction",
      value: report.client_satisfaction_avg != null ? `${report.client_satisfaction_avg.toFixed(1)} / 5` : "—",
      icon: <Star className="size-5 text-yellow-500" />,
      color: "text-yellow-600",
    },
  ];

  // Delta vs agency avg
  const deltaRevenue = report.total_revenue_pence - agencyAvg.total_revenue_pence;
  const deltaConversion = (report.conversion_rate - agencyAvg.conversion_rate) * 100;
  const deltaSold = report.listings_sold_count - agencyAvg.listings_sold_count;

  return (
    <div className="space-y-6">
      {/* Branch selector */}
      {branches.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" htmlFor="branch-select">
            Branch:
          </label>
          <select
            id="branch-select"
            value={selectedBranchId}
            onChange={(e) => void handleBranchChange(e.target.value)}
            disabled={loading}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}{b.is_head_office ? " (Head Office)" : ""}
              </option>
            ))}
          </select>
          {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
        </div>
      )}

      {/* KPI summary row */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map(({ label, value, icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                {icon}
                <span className={`text-xl font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branch vs agency average deltas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch vs Agency Average</CardTitle>
          <CardDescription>Performance delta compared to agency-wide averages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 justify-around py-2">
            <DeltaBadge value={deltaSold} label="Listings Sold" />
            <DeltaBadge value={deltaRevenue} label="Revenue" />
            <DeltaBadge value={deltaConversion} label="Conversion %" />
          </div>
        </CardContent>
      </Card>

      {/* Team comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Performance</CardTitle>
          <CardDescription>Per-member metrics for this branch, sorted by deals closed</CardDescription>
        </CardHeader>
        <CardContent>
          {teamRows.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No team members in this branch
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

      {/* Team comparison bar chart */}
      {teamChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Comparison</CardTitle>
            <CardDescription>Leads, viewings, and deals per team member</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="leads" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Leads" />
                <Bar dataKey="viewings" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Viewings" />
                <Bar dataKey="deals" fill="#10b981" radius={[3, 3, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
