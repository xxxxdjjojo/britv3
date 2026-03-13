"use client";

import { useState, useCallback } from "react";
import type { CompetitorEntry } from "@/services/agent/agent-analytics-service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function CompetitorAnalysis() {
  const [area, setArea] = useState("");
  const [results, setResults] = useState<CompetitorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = area.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ type: "competitor", area: trimmed });
      const res = await fetch(`/api/agent/analytics?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { analysis: CompetitorEntry[] };
        setResults(data.analysis);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [area]);

  const chartData = results.map((r, i) => ({
    name: `Agency ${i + 1}`,
    market_share: r.market_share,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Competitor Analysis
      </h1>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Enter postcode or area name (e.g. SW1A)"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !area.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No competitor data found for this area.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Table */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Agency Name
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Active Listings
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Avg Price
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Market Share %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((entry, i) => (
                    <tr
                      key={entry.agent_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {`Agency ${i + 1}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {entry.listing_count}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {`\u00A3${entry.avg_price.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {`${entry.market_share}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Market Share Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Market Share Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Market Share"]}
                />
                <Bar
                  dataKey="market_share"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Data derived from public listing information.
          </p>
        </>
      )}
    </div>
  );
}
