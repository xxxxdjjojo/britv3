"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, BarChart2, MapPin, Lightbulb } from "lucide-react";
import type { LandRegistryComparable } from "@/services/properties/land-registry-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HistoryEntry = {
  date: string;
  price: number;
  event?: string;
};

type PriceHistoryProps = Readonly<{
  history: HistoryEntry[];
  comparables?: LandRegistryComparable[] | null;
  pastSales?: LandRegistryComparable[] | null;
  className?: string;
}>;

type Tab = "history" | "comparables" | "insights";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function formatPriceAxis(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  return `£${(n / 1000).toFixed(0)}k`;
}

// ---------------------------------------------------------------------------
// Event colour map
// ---------------------------------------------------------------------------

const EVENT_COLOURS: Record<string, string> = {
  Listed: "var(--color-brand-primary, #2563eb)",
  Reduced: "var(--color-destructive, #dc2626)",
  SSTC: "var(--color-brand-secondary, #d97706)",
  Sold: "var(--color-success, #16a34a)",
};

function dotColour(event?: string): string {
  return event ? (EVENT_COLOURS[event] ?? "var(--color-brand-primary, #2563eb)") : "var(--color-brand-primary, #2563eb)";
}

// ---------------------------------------------------------------------------
// Custom tooltip for Recharts
// ---------------------------------------------------------------------------

function PriceTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HistoryEntry;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground">{formatPrice(d.price)}</p>
      <p className="text-muted-foreground">
        {formatShortDate(d.date)}
        {d.event ? ` · ${d.event}` : ""}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom dot renderer to vary colour by event
// ---------------------------------------------------------------------------

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: HistoryEntry;
};

function EventDot({ cx = 0, cy = 0, payload }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  const r = payload?.event ? 6 : 4;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={dotColour(payload?.event)}
      stroke="white"
      strokeWidth={2}
    />
  );
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Comparables table
// ---------------------------------------------------------------------------

function ComparablesTable({
  comparables,
}: {
  comparables: LandRegistryComparable[] | null | undefined;
}) {
  if (!comparables || comparables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MapPin className="size-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">
          No nearby sold prices available
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Land Registry data may not yet be available for this postcode.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border divide-y text-sm overflow-hidden">
      {comparables.map((row, i) => (
        <div
          key={`${row.address}-${row.date}`}
          className="flex items-center justify-between px-4 py-3 gap-4"
        >
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{row.address}</p>
            <p className="text-xs text-muted-foreground">
              {row.property_type}
              {row.new_build ? " · New Build" : ""}
              {" · "}
              {row.tenure}
              {" · Sold "}
              {new Date(row.date).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <p className="font-semibold shrink-0">{formatPrice(row.price)}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Past sale history (this exact property — HM Land Registry)
// ---------------------------------------------------------------------------

function PastSaleHistory({
  sales,
}: {
  sales: LandRegistryComparable[];
}) {
  const sortedSales = [...sales].sort((a, b) => b.date.localeCompare(a.date));
  const headline = sortedSales[0];

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Sale history for this property
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recorded by HM Land Registry · {sortedSales.length} sale
            {sortedSales.length === 1 ? "" : "s"}
          </p>
        </div>
        {headline && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Last sold</p>
            <p className="text-lg font-bold text-foreground">
              {formatPrice(headline.price)}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(headline.date).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>

      <ol className="space-y-2">
        {sortedSales.map((sale) => (
          <li
            key={`${sale.date}-${sale.price}`}
            className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {formatPrice(sale.price)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {sale.property_type}
                {sale.new_build ? " · New Build" : ""}
                {" · "}
                {sale.tenure}
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {new Date(sale.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market insights placeholder
// ---------------------------------------------------------------------------

function MarketInsights() {
  return (
    <div className="rounded-xl border bg-muted/40 p-6 flex flex-col items-center text-center gap-3">
      <Lightbulb className="size-8 text-muted-foreground opacity-60" />
      <div>
        <p className="font-semibold text-foreground">Market analysis coming soon</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          TrueDeed Insights will show price trends, days on market, demand
          indicators, and neighbourhood comparisons for this area.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PriceHistory({
  history,
  comparables,
  pastSales,
  className,
}: PriceHistoryProps) {
  const [activeTab, setActiveTab] = useState<Tab>("history");

  if (history.length === 0 && !comparables?.length && !pastSales?.length) {
    return null;
  }

  // Price change summary
  const first = history[0]?.price ?? 0;
  const last = history[history.length - 1]?.price ?? 0;
  const change = last - first;
  const changePct = first > 0 ? ((change / first) * 100).toFixed(1) : "0.0";
  const isUp = change > 0;
  const isFlat = change === 0;

  // Recharts needs plain objects
  const chartData = history.map((h) => ({ ...h }));

  // Identify event entries for ReferenceLine vertical markers
  const eventEntries = history.filter((h) => h.event);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header: current price + change badge */}
      {history.length > 0 && (
        <div className="flex items-end gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-3xl font-bold text-foreground">{formatPrice(last)}</p>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium mb-1",
              isUp
                ? "bg-success-light text-success"
                : !isFlat
                  ? "bg-error-light text-error"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {isUp ? (
              <TrendingUp className="size-4" />
            ) : !isFlat ? (
              <TrendingDown className="size-4" />
            ) : (
              <Minus className="size-4" />
            )}
            {isUp ? "+" : ""}
            {changePct}% since listed
          </div>
        </div>
      )}

      {/* Past sale history — HM Land Registry record for this exact address */}
      {pastSales && pastSales.length > 0 && (
        <PastSaleHistory sales={pastSales} />
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b pb-3">
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          icon={BarChart2}
          label="Price History"
        />
        <TabButton
          active={activeTab === "comparables"}
          onClick={() => setActiveTab("comparables")}
          icon={MapPin}
          label="Nearby Sales"
        />
        <TabButton
          active={activeTab === "insights"}
          onClick={() => setActiveTab("insights")}
          icon={Lightbulb}
          label="Insights"
        />
      </div>

      {/* Tab panels */}
      {activeTab === "history" && (
        <div className="space-y-5">
          {history.length > 0 ? (
            <>
              {/* Recharts line chart */}
              <div className="w-full rounded-xl border bg-card p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 16, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      strokeOpacity={0.08}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={formatPriceAxis}
                      tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip content={<PriceTooltip />} />

                    {/* Event reference lines */}
                    {eventEntries.map((e, i) => (
                      <ReferenceLine
                        key={e.date || `event-${i}`}
                        x={e.date}
                        stroke={dotColour(e.event)}
                        strokeDasharray="4 3"
                        strokeOpacity={0.5}
                        label={{
                          value: e.event ?? "",
                          position: "top",
                          fontSize: 10,
                          fill: dotColour(e.event),
                          opacity: 0.8,
                        }}
                      />
                    ))}

                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-brand-primary, #2563eb)"
                      strokeWidth={2.5}
                      dot={<EventDot />}
                      activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Event legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                {(["Listed", "Reduced", "SSTC", "Sold"] as const).map((ev) => (
                  <div key={ev} className="flex items-center gap-1.5">
                    <div
                      className="size-3 rounded-full"
                      style={{ background: EVENT_COLOURS[ev] }}
                    />
                    <span className="text-muted-foreground">{ev}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No price history available for this property.
            </p>
          )}
        </div>
      )}

      {activeTab === "comparables" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Sold prices from HM Land Registry — may take 2–3 months to appear
            after completion.
          </p>
          <ComparablesTable comparables={comparables} />
        </div>
      )}

      {activeTab === "insights" && <MarketInsights />}
    </div>
  );
}
