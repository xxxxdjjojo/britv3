"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Home } from "lucide-react";
import type { MarketAppraisalData, ComparableSale } from "@/services/agent/agent-analytics-service";

// --------------------------------------------------------------------------
// Formatters
// --------------------------------------------------------------------------

function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

// --------------------------------------------------------------------------
// Skeleton
// --------------------------------------------------------------------------

function Skeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-40" />
    </div>
  );
}

// --------------------------------------------------------------------------
// Price range boxes
// --------------------------------------------------------------------------

function PriceBox({
  label,
  value,
  highlight,
}: Readonly<{
  label: string;
  value: number;
  highlight?: boolean;
}>) {
  return (
    <Card
      className={highlight ? "border-brand-primary ring-1 ring-brand-primary" : ""}
    >
      <CardContent className="flex flex-col items-center gap-1 pt-6 pb-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{formatGBP(value)}</p>
        {highlight && (
          <Badge variant="default" className="mt-1 text-[10px]">
            Recommended
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// --------------------------------------------------------------------------
// Comparables table
// --------------------------------------------------------------------------

function ComparablesTable({
  comparables,
}: Readonly<{
  comparables: ComparableSale[];
}>) {
  if (comparables.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No comparable sales found for this postcode.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">
              Postcode
            </th>
            <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">
              Sold Date
            </th>
            <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">
              Price
            </th>
            <th className="pb-2 text-xs font-medium text-muted-foreground">
              Beds
            </th>
          </tr>
        </thead>
        <tbody>
          {comparables.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-mono text-xs">{c.postcode}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {c.sold_at
                  ? new Date(c.sold_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="py-2 pr-4 font-medium">{formatGBP(c.price)}</td>
              <td className="py-2 text-muted-foreground">
                {c.bedrooms ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------------------------------
// Mock price trend data (12 months) — replaced by real data when available
// --------------------------------------------------------------------------

function buildPriceTrendData(
  appraisal: MarketAppraisalData,
): Array<{ month: string; price: number }> {
  // Build 12-month trend from avg_price as baseline with slight variation
  const now = new Date();
  const base = appraisal.avg_price;
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const monthLabel = d.toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    });
    // Simple linear interpolation from 95% to 100% of avg
    const factor = 0.95 + (i / 11) * 0.05;
    return { month: monthLabel, price: Math.round(base * factor) };
  });
}

// --------------------------------------------------------------------------
// Main component
// --------------------------------------------------------------------------

export function MarketAppraisalTool() {
  const [postcode, setPostcode] = useState("");
  const [results, setResults] = useState<MarketAppraisalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!postcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/agent/analytics?type=appraisal&postcode=${encodeURIComponent(postcode.trim())}`,
      );

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to fetch appraisal data");
      }

      const data = (await res.json()) as MarketAppraisalData;
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const trendData = results ? buildPriceTrendData(results) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="size-4" />
            Market Appraisal Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Enter postcode, e.g. SW1A 1AA"
              className="max-w-xs"
              aria-label="Postcode"
            />
            <Button type="submit" disabled={loading || !postcode.trim()}>
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && <LoadingSkeleton />}

      {/* Results */}
      {!loading && results && (
        <>
          {/* Price range */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Suggested Price Range
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PriceBox
                label="Conservative Estimate"
                value={results.suggested_min_price}
              />
              <PriceBox
                label="Market Average"
                value={results.avg_price}
                highlight
              />
              <PriceBox
                label="Optimistic Estimate"
                value={results.suggested_max_price}
              />
            </div>
          </div>

          {/* Price trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" />
                Average Price Trend (12 months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(v: number) =>
                      `£${(v / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatGBP(value), "Avg Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    strokeWidth={2}
                    dot={false}
                    className="stroke-brand-primary"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comparables chart */}
          {results.comparable_sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Comparable Sales by Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={results.comparable_sales.slice(0, 10).map((c, i) => ({
                      name: `${c.postcode ?? `#${i + 1}`}`,
                      price: c.price,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        `£${(v / 1000).toFixed(0)}k`
                      }
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatGBP(value), "Price"]}
                    />
                    <Bar dataKey="price" className="fill-brand-primary" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Comparables table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comparable Sales
                <Badge variant="secondary" className="ml-2">
                  {results.comparable_sales.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparablesTable comparables={results.comparable_sales} />
              <p className="mt-4 text-[10px] text-muted-foreground">
                Data: HM Land Registry Price Paid Data (Open Government Licence)
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
