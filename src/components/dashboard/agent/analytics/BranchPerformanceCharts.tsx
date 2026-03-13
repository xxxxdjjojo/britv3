"use client";

import { useState, useCallback } from "react";
import type { PerformanceReport } from "@/services/agent/agent-analytics-service";
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

type Branch = Readonly<{ id: string; name: string }>;

const TEAM_MEMBERS_PLACEHOLDER = [
  { name: "Alice Johnson", leads: 24, viewings: 18, deals: 6, revenue: 18200 },
  { name: "Bob Smith", leads: 31, viewings: 22, deals: 8, revenue: 24800 },
  { name: "Carol Davis", leads: 19, viewings: 14, deals: 4, revenue: 12600 },
  { name: "Dan Wilson", leads: 27, viewings: 20, deals: 7, revenue: 21400 },
];

function KpiCard(props: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {props.value}
      </p>
    </div>
  );
}

export function BranchPerformanceCharts(
  props: Readonly<{
    branches: Branch[];
    initialReport: PerformanceReport | null;
  }>,
) {
  const [selectedBranch, setSelectedBranch] = useState(
    props.branches[0]?.id ?? "",
  );
  const [report, setReport] = useState<PerformanceReport | null>(
    props.initialReport,
  );
  const [loading, setLoading] = useState(false);

  const fetchBranch = useCallback(async (branchId: string) => {
    setSelectedBranch(branchId);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: "branch",
        branch_id: branchId,
      });
      const res = await fetch(`/api/agent/analytics?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { report: PerformanceReport };
        setReport(data.report);
      }
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Branch Performance
        </h1>
        {props.branches.length > 0 && (
          <select
            value={selectedBranch}
            onChange={(e) => fetchBranch(e.target.value)}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {props.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {props.branches.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No branches found. Create a branch to view performance data.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="Listings Sold"
              value={String(report?.listings_sold ?? 0)}
            />
            <KpiCard
              label="Avg Days on Market"
              value={String(report?.avg_time_on_market_days ?? 0)}
            />
            <KpiCard
              label="Total Revenue"
              value={`\u00A3${(report?.total_revenue ?? 0).toLocaleString()}`}
            />
            <KpiCard
              label="Conversion Rate"
              value={`${((report?.conversion_rate ?? 0) * 100).toFixed(1)}%`}
            />
            <KpiCard
              label="Avg Rating"
              value={
                report && report.avg_rating > 0
                  ? report.avg_rating.toFixed(1)
                  : "N/A"
              }
            />
          </div>

          {/* Team Comparison Table */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Team Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Member Name
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Leads
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Viewings
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Deals
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {TEAM_MEMBERS_PLACEHOLDER.map((member) => (
                    <tr
                      key={member.name}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {member.leads}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {member.viewings}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {member.deals}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {`\u00A3${member.revenue.toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Bar Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Team Member Performance
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={TEAM_MEMBERS_PLACEHOLDER}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deals" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
