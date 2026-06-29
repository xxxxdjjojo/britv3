"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeadForm } from "./LeadForm";
import { UnitStatusBadge } from "./AvailabilityBadge";
import { formatGbp } from "@/lib/new-homes/format";
import { cn } from "@/lib/utils";
import type { DevelopmentUnit } from "@/lib/new-homes/types";

type StatusFilter = "all" | "available" | "reserved" | "sold";
type ViewMode = "plan" | "table";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Sold", value: "sold" },
];

const PLOT_TILE_STYLES: Record<DevelopmentUnit["status"], string> = {
  available: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-500",
  reserved: "border-amber-300 bg-amber-50 text-amber-900",
  sold: "border-neutral-200 bg-neutral-100 text-neutral-400",
};

export function UnitAvailability({
  developmentId,
  developmentName,
  units,
}: Readonly<{
  developmentId: string;
  developmentName: string;
  units: DevelopmentUnit[];
}>) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [bedsMin, setBedsMin] = useState(0);
  const [view, setView] = useState<ViewMode>("plan");
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  const maxBeds = useMemo(
    () => units.reduce((m, u) => Math.max(m, u.beds), 0),
    [units],
  );

  const filtered = useMemo(
    () =>
      units.filter((u) => {
        if (status !== "all" && u.status !== status) return false;
        if (bedsMin > 0 && u.beds < bedsMin) return false;
        return true;
      }),
    [units, status, bedsMin],
  );

  const selectedUnit = units.find((u) => u.plotNumber === selectedPlot) ?? null;

  if (units.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
        Plot availability for this development will be published shortly.
      </p>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-neutral-300 p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                status === f.value
                  ? "bg-brand-primary text-white"
                  : "text-neutral-600 hover:text-neutral-900",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          aria-label="Minimum bedrooms"
          className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm text-neutral-700"
          value={bedsMin}
          onChange={(e) => setBedsMin(Number(e.target.value))}
        >
          <option value={0}>Any beds</option>
          {Array.from({ length: maxBeds }, (_, i) => i + 1).map((b) => (
            <option key={b} value={b}>
              {b}+ beds
            </option>
          ))}
        </select>

        <div className="ml-auto inline-flex rounded-lg border border-neutral-300 p-0.5">
          <button
            type="button"
            onClick={() => setView("plan")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              view === "plan" ? "bg-neutral-900 text-white" : "text-neutral-600",
            )}
          >
            Site plan
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              view === "table" ? "bg-neutral-900 text-white" : "text-neutral-600",
            )}
          >
            Table
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No plots match these filters.
        </p>
      ) : view === "plan" ? (
        /* Visual site-plan placeholder — data-driven grid of plot tiles.
           TODO: swap this grid for an SVG site-plan overlay when developers
           upload a real masterplan (plot coordinates → polygons). */
        <div className="rounded-xl border border-neutral-200 bg-[linear-gradient(135deg,#f8faf9,#eef4f1)] p-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={u.status === "sold"}
                onClick={() => setSelectedPlot(u.plotNumber)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg border-2 p-1 text-center transition-all disabled:cursor-not-allowed",
                  PLOT_TILE_STYLES[u.status],
                  u.status !== "sold" && "hover:-translate-y-0.5 hover:shadow",
                )}
                title={`Plot ${u.plotNumber} — ${u.unitType}`}
              >
                <span className="text-xs font-bold">{u.plotNumber}</span>
                <span className="text-[10px] leading-tight opacity-80">
                  {u.beds} bed
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
            <Legend className="bg-emerald-300" label="Available" />
            <Legend className="bg-amber-300" label="Reserved" />
            <Legend className="bg-neutral-300" label="Sold" />
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Plot</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Beds</th>
                <th className="px-3 py-2 font-semibold">Size</th>
                <th className="px-3 py-2 font-semibold">Price</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-semibold text-neutral-900">{u.plotNumber}</td>
                  <td className="px-3 py-2 text-neutral-700">{u.unitType}</td>
                  <td className="px-3 py-2 text-neutral-700">{u.beds}</td>
                  <td className="px-3 py-2 text-neutral-700">
                    {u.sizeSqft ? `${u.sizeSqft.toLocaleString()} sq ft` : "—"}
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-900">{formatGbp(u.price)}</td>
                  <td className="px-3 py-2"><UnitStatusBadge status={u.status} /></td>
                  <td className="px-3 py-2 text-right">
                    {u.status === "available" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedPlot(u.plotNumber)}
                        className="text-sm font-semibold text-brand-primary hover:underline"
                      >
                        Enquire
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                    {u.floorplanUrl ? (
                      <a
                        href={u.floorplanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-sm font-medium text-neutral-500 hover:underline"
                      >
                        Floorplan
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-unit enquiry dialog */}
      <Dialog open={selectedPlot !== null} onOpenChange={(o) => !o && setSelectedPlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              Enquire about Plot {selectedUnit?.plotNumber}
            </DialogTitle>
            <DialogDescription>
              {developmentName}
              {selectedUnit
                ? ` — ${selectedUnit.unitType}, ${formatGbp(selectedUnit.price)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedUnit ? (
            <LeadForm
              developmentId={developmentId}
              leadType="register_interest"
              units={units}
              defaultPlot={selectedUnit.plotNumber}
              onSuccess={() => undefined}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Legend({ className, label }: Readonly<{ className: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-3 rounded", className)} />
      {label}
    </span>
  );
}
