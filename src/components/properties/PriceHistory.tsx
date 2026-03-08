"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type HistoryEntry = {
  date: string;
  price: number;
  event?: string;
};

type PriceHistoryProps = Readonly<{
  history: HistoryEntry[];
  className?: string;
}>;

const CHART_W = 600;
const CHART_H = 200;
const PAD = { top: 20, right: 20, bottom: 30, left: 60 };

function formatPrice(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export function PriceHistory({ history, className }: PriceHistoryProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    entry: HistoryEntry;
  } | null>(null);

  if (history.length === 0) {
    return null;
  }

  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  // Map data to SVG coords
  const points = history.map((entry, i) => ({
    x: PAD.left + (i / Math.max(history.length - 1, 1)) * innerW,
    y: PAD.top + innerH - ((entry.price - minPrice) / priceRange) * innerH,
    entry,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Price change
  const first = history[0].price;
  const last = history[history.length - 1].price;
  const change = last - first;
  const changePct = ((change / first) * 100).toFixed(1);
  const isUp = change >= 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current price + change indicator */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="text-3xl font-bold text-foreground">{formatPrice(last)}</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium mb-1",
            isUp
              ? "bg-green-100 text-green-700"
              : change < 0
                ? "bg-red-100 text-red-700"
                : "bg-muted text-muted-foreground",
          )}
        >
          {isUp ? (
            <TrendingUp className="size-4" />
          ) : change < 0 ? (
            <TrendingDown className="size-4" />
          ) : (
            <Minus className="size-4" />
          )}
          {isUp ? "+" : ""}
          {changePct}% since listed
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="w-full overflow-x-auto rounded-xl border bg-card p-2">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          style={{ minWidth: "280px", height: "auto" }}
          aria-label="Price history chart"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD.top + t * innerH;
            const price = maxPrice - t * priceRange;
            return (
              <g key={t}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={CHART_W - PAD.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  opacity="0.5"
                >
                  £{(price / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={CHART_H - 4}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.5"
            >
              {formatShortDate(p.entry.date)}
            </text>
          ))}

          {/* Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="var(--color-brand-primary, currentColor)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Area fill */}
          <polygon
            points={`${PAD.left},${PAD.top + innerH} ${polylinePoints} ${CHART_W - PAD.right},${PAD.top + innerH}`}
            fill="var(--color-brand-primary, currentColor)"
            fillOpacity="0.08"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.entry.event ? 6 : 4}
              fill={
                p.entry.event === "Reduced"
                  ? "var(--color-destructive, red)"
                  : p.entry.event === "SSTC"
                    ? "var(--color-brand-secondary, orange)"
                    : "var(--color-brand-primary, green)"
              }
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y, entry: p.entry })}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x - 55, CHART_W - 120)}
                y={tooltip.y - 52}
                width="110"
                height="46"
                rx="6"
                fill="white"
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="1"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
              />
              <text
                x={Math.min(tooltip.x - 55, CHART_W - 120) + 55}
                y={tooltip.y - 33}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#111"
              >
                {formatPrice(tooltip.entry.price)}
              </text>
              <text
                x={Math.min(tooltip.x - 55, CHART_W - 120) + 55}
                y={tooltip.y - 18}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {formatShortDate(tooltip.entry.date)}
                {tooltip.entry.event ? ` · ${tooltip.entry.event}` : ""}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Event legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(["Listed", "Reduced", "SSTC"] as const).map((ev) => (
          <div key={ev} className="flex items-center gap-1.5">
            <div
              className={cn(
                "size-3 rounded-full",
                ev === "Listed"
                  ? "bg-brand-primary"
                  : ev === "Reduced"
                    ? "bg-destructive"
                    : "bg-brand-secondary",
              )}
            />
            <span className="text-muted-foreground">{ev}</span>
          </div>
        ))}
      </div>

      {/* Nearby Sold Prices */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Nearby Sold Prices</h3>
        <div className="rounded-xl border divide-y text-sm overflow-hidden">
          {[
            {
              address: "12 Elm Road, Isleworth, TW7 4PQ",
              price: 410000,
              date: "Jan 2026",
              type: "Terraced",
            },
            {
              address: "8 Maple Avenue, Isleworth, TW7 5AR",
              price: 450000,
              date: "Nov 2025",
              type: "Terraced",
            },
            {
              address: "3 Oak Lane, Hounslow, TW3 1AB",
              price: 395000,
              date: "Oct 2025",
              type: "Semi-detached",
            },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 gap-4"
            >
              <div>
                <p className="font-medium text-foreground">{row.address}</p>
                <p className="text-xs text-muted-foreground">
                  {row.type} · Sold {row.date}
                </p>
              </div>
              <p className="font-semibold shrink-0">{formatPrice(row.price)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
