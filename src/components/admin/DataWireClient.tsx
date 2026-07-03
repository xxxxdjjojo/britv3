"use client";

import { useMemo, useState } from "react";
import { Download, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildPressPack,
  formatSignedGapPct,
  pressPackToPlainText,
  type PressPack,
} from "@/content/data-wire/templates";
import {
  AREA_MEDIAN_MIN_ASKING_N,
  AREA_MEDIAN_MIN_SOLD_N,
} from "@/services/reports/reality-gap-thresholds";
import type { WireArea } from "@/services/data-wire/data-wire-service";

type Props = Readonly<{
  period: string;
  areas: WireArea[];
}>;

function packFor(area: WireArea): PressPack {
  return buildPressPack({
    areaName: area.areaName,
    areaId: area.areaId,
    period: area.period,
    gapPct: area.gapPct,
    medianAsking: area.medianAskingPounds,
    medianSold: area.medianSoldPounds,
    sampleAsking: area.sampleAskingN,
    sampleSold: area.sampleSoldN,
    rank: area.rank,
    totalRanked: area.totalRanked,
  });
}

function PackPreview({ area }: Readonly<{ area: WireArea }>) {
  const pack = packFor(area);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pressPackToPlainText(pack));
      toast.success("Press pack copied as plain text");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div className="mt-4 rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-heading text-base font-semibold text-neutral-900">
          {pack.headline}
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="shrink-0 text-xs"
        >
          <Copy className="mr-1 h-3.5 w-3.5" />
          Copy as text
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {pack.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm text-neutral-700">
            {paragraph}
          </p>
        ))}
      </div>
      <p className="mt-4 border-t border-border pt-3 text-xs text-neutral-500">
        {pack.boilerplate}
      </p>
      <p className="mt-2 text-xs font-semibold text-neutral-700">
        {pack.attribution}
      </p>
    </div>
  );
}

function AreaRow({
  area,
  period,
}: Readonly<{ area: WireArea; period: string }>) {
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/data-wire/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaId: area.areaId, period }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Failed to generate the press pack");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `truedeed-data-wire-${area.areaId}-${period}.html`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(`Press pack for ${area.areaName} downloaded`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to generate the press pack",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {area.areaName}
          </p>
          <p className="text-xs text-neutral-500">
            Gap {formatSignedGapPct(area.gapPct)} · Rank {area.rank} of{" "}
            {area.totalRanked}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPreview((prev) => !prev)}
            aria-expanded={showPreview}
            className="text-xs"
          >
            {showPreview ? (
              <EyeOff className="mr-1 h-3.5 w-3.5" />
            ) : (
              <Eye className="mr-1 h-3.5 w-3.5" />
            )}
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs"
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            {generating ? "Generating…" : "Generate pack"}
          </Button>
        </div>
      </div>
      {showPreview && <PackPreview area={area} />}
    </li>
  );
}

export function DataWireClient({ period, areas }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return areas;
    return areas.filter((area) =>
      area.areaName.toLowerCase().includes(needle),
    );
  }, [areas, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            Edition {period}
          </p>
          <p className="text-xs text-neutral-500">
            Packs are only available for districts above the disclosed sample
            thresholds (at least {AREA_MEDIAN_MIN_ASKING_N} asking prices and{" "}
            {AREA_MEDIAN_MIN_SOLD_N} recorded sales).
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search districts…"
            aria-label="Search districts"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          No districts match “{query}”.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((area) => (
            <AreaRow key={area.areaId} area={area} period={period} />
          ))}
        </ul>
      )}
    </div>
  );
}
