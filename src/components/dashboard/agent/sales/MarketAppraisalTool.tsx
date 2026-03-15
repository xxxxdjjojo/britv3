"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import type { MarketAppraisalData } from "@/services/agent/agent-analytics-service";

// ============================================================================
// Helpers
// ============================================================================

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

// ============================================================================
// Price Range Indicator
// ============================================================================

type PriceRangeProps = Readonly<{
  min: number;
  mid: number;
  max: number;
}>;

function PriceRangeIndicator({ min, mid, max }: PriceRangeProps) {
  // Normalise positions as percentages
  const range = max - min;
  const midPos = range > 0 ? ((mid - min) / range) * 100 : 50;

  return (
    <div className="mt-4">
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Low</span>
        <span>Mid (avg)</span>
        <span>High</span>
      </div>

      {/* Bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        {/* Gradient fill */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300 via-blue-500 to-blue-700" />

        {/* Mid marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
          style={{ left: `${midPos}%` }}
        />
      </div>

      {/* Values */}
      <div className="flex justify-between mt-2">
        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatGBP(min)}
        </div>
        <div className="text-sm font-semibold">{formatGBP(mid)}</div>
        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {formatGBP(max)}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function MarketAppraisalTool() {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketAppraisalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = postcode.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/agent/analytics?type=appraisal&postcode=${encodeURIComponent(trimmed)}`,
      );

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to fetch appraisal data");
      }

      const result = (await res.json()) as MarketAppraisalData;

      if (result.comparable_count === 0) {
        setError(
          `No comparable properties found in postcode district "${result.postcode_district}". Try a different postcode.`,
        );
      } else {
        setData(result);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch appraisal data",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void handleSearch();
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Enter postcode (e.g. SW1A 1AA)"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-base"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !postcode.trim()}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Search className="size-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 border border-destructive/30 bg-destructive/5 rounded-lg text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Postcode District</p>
                <p className="text-2xl font-bold mt-1">{data.postcode_district}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Comparable Properties</p>
                <p className="text-2xl font-bold mt-1">{data.comparable_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Median Price</p>
                <p className="text-2xl font-bold mt-1">
                  {formatGBP(data.median_price_pence)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Price range indicator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4" />
                Suggested Price Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PriceRangeIndicator
                min={data.suggested_min_pence}
                mid={data.avg_price_pence}
                max={data.suggested_max_pence}
              />

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Average Price</p>
                  <p className="font-semibold">{formatGBP(data.avg_price_pence)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Median Price</p>
                  <p className="font-semibold">{formatGBP(data.median_price_pence)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparable properties note */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparable Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Based on {data.comparable_count} active listing
                {data.comparable_count !== 1 ? "s" : ""} in the{" "}
                <span className="font-medium">{data.postcode_district}</span> postcode
                district.
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Suggested minimum</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatGBP(data.suggested_min_pence)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average price</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatGBP(data.avg_price_pence)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Median price</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatGBP(data.median_price_pence)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Suggested maximum</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatGBP(data.suggested_max_pence)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Avg. days on market</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {data.avg_days_on_market != null
                        ? `${data.avg_days_on_market} days`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Attribution */}
          <p className="text-xs text-muted-foreground text-center">
            Data sourced from property listings on Britestate. Prices are in pence and
            converted to GBP. Suggested range is ±10% of the average.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!data && !error && !loading && (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <Search className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Enter a postcode above to generate a market appraisal.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Results are based on comparable active listings in the same postcode district.
          </p>
        </div>
      )}
    </div>
  );
}
