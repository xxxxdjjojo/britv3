"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Comparable = Readonly<{
  id: string;
  price: number;
  sold_at: string | null;
  address: string | null;
}>;

type AppraisalResult = Readonly<{
  comparables: Comparable[];
  suggested_range: { low: number; mid: number; high: number };
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildPriceDistribution(comparables: Comparable[]): Array<{ range: string; count: number }> {
  if (comparables.length === 0) return [];

  const prices = comparables.map((c) => c.price).filter((p) => p > 0);
  if (prices.length === 0) return [];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const bucketSize = Math.max(Math.ceil((max - min) / 5), 10000);
  const buckets: Record<string, number> = {};

  for (const price of prices) {
    const bucketStart = Math.floor((price - min) / bucketSize) * bucketSize + min;
    const label = `${formatPrice(bucketStart)}`;
    buckets[label] = (buckets[label] ?? 0) + 1;
  }

  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarketAppraisalTool() {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AppraisalResult | null>(null);

  const handleSearch = async () => {
    const trimmed = postcode.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a postcode");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/agent/analytics?type=appraisal&postcode=${encodeURIComponent(trimmed)}`,
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch appraisal data");
      }

      const data = await res.json();
      setResult(data as AppraisalResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const distribution = result ? buildPriceDistribution(result.comparables) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Market Appraisal
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Search by postcode to view comparable sales and suggested valuations.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter postcode (e.g. SW1A 1AA)"
          className="flex-1 sm:max-w-xs rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {result && (
        <>
          {/* Suggested Price Range */}
          {result.suggested_range.mid > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PriceCard
                label="Low Estimate"
                price={result.suggested_range.low}
                color="text-amber-600 dark:text-amber-400"
              />
              <PriceCard
                label="Mid Estimate"
                price={result.suggested_range.mid}
                color="text-green-600 dark:text-green-400"
                highlight
              />
              <PriceCard
                label="High Estimate"
                price={result.suggested_range.high}
                color="text-blue-600 dark:text-blue-400"
              />
            </div>
          )}

          {/* Price Distribution Chart */}
          {distribution.length > 0 && (
            <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Price Distribution
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Comparables Table */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Comparable Sales ({result.comparables.length})
              </h2>
            </div>
            {result.comparables.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No comparable sales found for this postcode.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700 text-left">
                      <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                        Address
                      </th>
                      <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                        Sold Price
                      </th>
                      <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {result.comparables.map((comp) => (
                      <tr key={comp.id}>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          {comp.address ?? "Address unavailable"}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">
                          {formatPrice(comp.price)}
                        </td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                          {comp.sold_at
                            ? new Date(comp.sold_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attribution */}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Data: HM Land Registry Price Paid Data
          </p>
        </>
      )}

      {result === null && !loading && !error && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-sm">Enter a postcode above to get started.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Price Card
// ---------------------------------------------------------------------------

function PriceCard(
  props: Readonly<{
    label: string;
    price: number;
    color: string;
    highlight?: boolean;
  }>
) {
  return (
    <div
      className={[
        "rounded-xl border p-4 text-center dark:border-gray-700",
        props.highlight
          ? "ring-2 ring-green-400 bg-green-50 dark:bg-green-950/30"
          : "bg-white dark:bg-gray-900",
      ].join(" ")}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {props.label}
      </p>
      <p className={`text-2xl font-bold ${props.color}`}>
        {formatPrice(props.price)}
      </p>
    </div>
  );
}
