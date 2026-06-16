"use client";

import { useState } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentSaleProgressionWithRisk, SaleStage } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";
import { ChainDetailDialog } from "@/components/dashboard/agent/sales/ChainDetailDialog";

// --------------------------------------------------------------------------
// Stage metadata
// --------------------------------------------------------------------------

const STAGE_LABELS: Record<SaleStage, { label: string; desc: string }> = {
  offer_accepted: {
    label: "Offer Accepted",
    desc: "Offer accepted, memo of sale pending",
  },
  memorandum_of_sale: {
    label: "Memo of Sale",
    desc: "Memorandum of sale issued",
  },
  solicitors_instructed: {
    label: "Solicitors",
    desc: "Both parties solicitors instructed",
  },
  searches: { label: "Searches", desc: "Local searches underway" },
  survey: { label: "Survey", desc: "Property survey booked" },
  mortgage: { label: "Mortgage", desc: "Mortgage offer received" },
  exchange: { label: "Exchange", desc: "Contracts exchanged" },
  completion: { label: "Completion", desc: "Completion day" },
};

// "Early" stages shown under LISTING ACTIVE tab, later ones under UNDER OFFER
const LISTING_ACTIVE_STAGES: SaleStage[] = [
  "offer_accepted",
  "memorandum_of_sale",
  "solicitors_instructed",
  "searches",
];
const UNDER_OFFER_STAGES: SaleStage[] = [
  "survey",
  "mortgage",
  "exchange",
  "completion",
];

// --------------------------------------------------------------------------
// Health colour helper
// --------------------------------------------------------------------------

function getDaysInStage(updatedAt: string): number {
  return Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function healthColour(days: number): string {
  if (days <= 7) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (days <= 14) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
}

// --------------------------------------------------------------------------
// Stage index helper
// --------------------------------------------------------------------------

function stageIndex(stage: SaleStage): number {
  return SALE_STAGES.indexOf(stage);
}

// --------------------------------------------------------------------------
// Sale list card (left pane)
// --------------------------------------------------------------------------

function SaleListCard({
  progression,
  isSelected,
  onSelect,
}: Readonly<{
  progression: AgentSaleProgressionWithRisk;
  isSelected: boolean;
  onSelect: (p: AgentSaleProgressionWithRisk) => void;
}>) {
  const days = getDaysInStage(progression.updated_at);
  const hasChainRisk =
    progression.chain_risk &&
    (progression.chain_risk.risk_level === "high" ||
      progression.chain_risk.risk_level === "critical");

  return (
    <button
      type="button"
      onClick={() => onSelect(progression)}
      className={`w-full text-left rounded-xl border transition-all ${
        isSelected
          ? "border-brand-primary bg-brand-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-brand-primary/40 hover:shadow-sm"
      }`}
    >
      {/* Property image placeholder + risk pill */}
      <div className="relative h-28 w-full overflow-hidden rounded-t-xl bg-neutral-100 dark:bg-neutral-800">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Placeholder property visual */}
          <div className="grid h-full w-full grid-cols-2 gap-0.5 opacity-30">
            <div className="bg-neutral-300 dark:bg-neutral-600" />
            <div className="bg-neutral-400 dark:bg-neutral-700" />
          </div>
        </div>
        {hasChainRisk && (
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
              POTENTIAL CHAIN RISK
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <p className="truncate text-xs font-semibold text-foreground">
          {progression.property_id}
        </p>
        {progression.expected_completion_date && (
          <p className="mt-0.5 text-[11px] text-neutral-500">
            ETA:{" "}
            {new Date(progression.expected_completion_date).toLocaleDateString(
              "en-GB",
            )}
          </p>
        )}

        {/* Bottom row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${healthColour(days)}`}
          >
            {days}d
          </span>
          <span className="truncate rounded-full border border-border px-2 py-0.5 text-[9px] font-medium text-neutral-500">
            {STAGE_LABELS[progression.stage].label}
          </span>
        </div>
      </div>
    </button>
  );
}

// --------------------------------------------------------------------------
// Vertical progression timeline (right pane)
// --------------------------------------------------------------------------

function ProgressionTimeline({
  progression,
}: Readonly<{
  progression: AgentSaleProgressionWithRisk;
}>) {
  const currentIdx = stageIndex(progression.stage);

  return (
    <div className="flex flex-col">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
        Progression Timeline
      </p>
      <ol className="relative flex flex-col gap-0">
        {SALE_STAGES.map((stage, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const meta = STAGE_LABELS[stage];

          return (
            <li key={stage} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Vertical connector line */}
              {idx < SALE_STAGES.length - 1 && (
                <div
                  className={`absolute left-[13px] top-7 h-[calc(100%-0px)] w-0.5 ${
                    isComplete ? "bg-brand-primary" : "bg-border"
                  }`}
                />
              )}

              {/* Stage node */}
              <div
                className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete
                    ? "border-brand-primary bg-brand-primary"
                    : isCurrent
                      ? "border-brand-primary bg-white dark:bg-background"
                      : "border-border bg-surface"
                }`}
              >
                {isComplete ? (
                  <svg
                    className="h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isCurrent ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
                ) : null}
              </div>

              {/* Stage content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-xs font-semibold leading-5 ${
                      isFuture ? "text-neutral-400" : "text-foreground"
                    }`}
                  >
                    {meta.label}
                  </p>
                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-primary">
                      Current
                    </span>
                  )}
                </div>
                {!isFuture && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                    {meta.desc}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// --------------------------------------------------------------------------
// Detail panel (right pane)
// --------------------------------------------------------------------------

function DetailPanel({
  progression,
  onViewChain,
}: Readonly<{
  progression: AgentSaleProgressionWithRisk;
  onViewChain: () => void;
}>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Property header */}
      <div className="border-b border-border pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          {STAGE_LABELS[progression.stage].label}
        </p>
        <h2 className="font-heading mt-1 text-lg font-bold leading-tight text-brand-primary-dark">
          {progression.property_id}
        </h2>

        {/* Key metrics row */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Price
            </p>
            <p className="mt-0.5 text-sm font-bold text-foreground">—</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Buyer
            </p>
            <p className="mt-0.5 text-sm font-bold text-foreground">—</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Chain
            </p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {progression.chain_risk
                ? `${progression.chain_risk.chain_length} links`
                : "No Chain"}
            </p>
          </div>
        </div>
      </div>

      {/* Progression timeline */}
      <div className="flex-1 py-4">
        <ProgressionTimeline progression={progression} />
      </div>

      {/* Notes */}
      {progression.notes && (
        <div className="border-t border-border py-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Notes
          </p>
          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            {progression.notes}
          </p>
        </div>
      )}

      {/* Chain action */}
      {progression.chain_risk && (
        <div className="sticky bottom-0 border-t border-border bg-surface pt-4 pb-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewChain}
          >
            View Chain ({progression.chain_risk.chain_length} links)
          </Button>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Detail dialog (kept for chain view; also used as fallback for mobile)
// --------------------------------------------------------------------------

function ProgressionDialog({
  progression,
  open,
  onClose,
}: Readonly<{
  progression: AgentSaleProgressionWithRisk | null;
  open: boolean;
  onClose: () => void;
}>) {
  const [chainDialogOpen, setChainDialogOpen] = useState(false);

  if (!progression) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Property ID</p>
              <p className="font-mono text-xs">{progression.property_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Offer ID</p>
              <p className="font-mono text-xs">{progression.offer_id}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Stage</p>
              <Badge variant="secondary">
                {STAGE_LABELS[progression.stage].label}
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-xs">Expected Completion Date</Label>
            <Input
              type="date"
              defaultValue={progression.expected_completion_date ?? ""}
              readOnly
              className="mt-1 text-sm"
            />
          </div>

          {progression.solicitor_buyer && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Buyer Solicitor
              </p>
              <div className="rounded-md bg-muted p-2 text-xs font-mono">
                {Object.entries(progression.solicitor_buyer).map(
                  ([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground">{k}:</span>
                      <span>{String(v)}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              defaultValue={progression.notes ?? ""}
              readOnly
              rows={3}
              className="mt-1 resize-none text-sm"
            />
          </div>

          {progression.chain_risk && (
            <>
              <Button variant="outline" size="sm" onClick={() => setChainDialogOpen(true)}>
                View Chain ({progression.chain_risk.chain_length} links)
              </Button>
              <ChainDetailDialog
                chainGroupId={progression.chain_risk.chain_group_id}
                open={chainDialogOpen}
                onClose={() => setChainDialogOpen(false)}
              />
            </>
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Main component
// --------------------------------------------------------------------------

type ProgressionsMap = Partial<Record<SaleStage, AgentSaleProgressionWithRisk[]>>;

type TabKey = "listing_active" | "under_offer";

const TAB_STAGES: Record<TabKey, SaleStage[]> = {
  listing_active: LISTING_ACTIVE_STAGES,
  under_offer: UNDER_OFFER_STAGES,
};

export function SaleProgressionKanban({
  initialProgressions,
}: Readonly<{
  initialProgressions: ProgressionsMap;
}>) {
  const [progressions, setProgressions] =
    useState<ProgressionsMap>(initialProgressions);
  const [activeTab, setActiveTab] = useState<TabKey>("listing_active");
  const [selected, setSelected] = useState<AgentSaleProgressionWithRisk | null>(null);
  const [chainDialogOpen, setChainDialogOpen] = useState(false);
  // Mobile fallback dialog
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Find which stage a progression currently lives in
  function findStage(id: string): SaleStage | undefined {
    for (const stage of SALE_STAGES) {
      if (progressions[stage]?.some((p) => p.id === id)) return stage;
    }
    return undefined;
  }

  // Find a progression by id across all stages
  function findProgression(id: string): AgentSaleProgressionWithRisk | undefined {
    for (const stage of SALE_STAGES) {
      const found = progressions[stage]?.find((p) => p.id === id);
      if (found) return found;
    }
    return undefined;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const sourceStage = findStage(active.id as string);
    const targetStage = (
      SALE_STAGES.includes(over.id as SaleStage)
        ? over.id
        : findStage(over.id as string)
    ) as SaleStage | undefined;

    if (!sourceStage || !targetStage || sourceStage === targetStage) return;

    const progression = findProgression(active.id as string);
    if (!progression) return;

    const prev = { ...progressions };
    setProgressions((cur) => {
      const next = { ...cur };
      next[sourceStage] = (cur[sourceStage] ?? []).filter(
        (p) => p.id !== progression.id,
      );
      next[targetStage] = [
        ...(cur[targetStage] ?? []),
        { ...progression, stage: targetStage },
      ];
      return next;
    });

    try {
      const res = await fetch("/api/agent/sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: progression.id, stage: targetStage }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update stage");
      }
    } catch (err) {
      setProgressions(prev);
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    }
  }

  // All progressions for current tab (flattened, ordered by stage)
  const tabStages = TAB_STAGES[activeTab];
  const tabProgressions = tabStages.flatMap(
    (stage) => progressions[stage] ?? [],
  );

  // Count per tab
  const listingActiveCount = LISTING_ACTIVE_STAGES.reduce(
    (acc, s) => acc + (progressions[s]?.length ?? 0),
    0,
  );
  const underOfferCount = UNDER_OFFER_STAGES.reduce(
    (acc, s) => acc + (progressions[s]?.length ?? 0),
    0,
  );

  // Auto-select first item when tab changes and nothing selected
  const visibleSelected =
    selected && tabStages.includes(selected.stage) ? selected : null;

  function handleSelect(p: AgentSaleProgressionWithRisk) {
    setSelected(p);
    setMobileDialogOpen(true);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        {/* Two-pane layout */}
        <div className="flex h-[calc(100vh-10rem)] min-h-[500px] gap-0 overflow-hidden rounded-xl border border-border bg-surface">
          {/* ---- LEFT PANE: sale list ---- */}
          <div className="flex w-72 shrink-0 flex-col border-r border-border">
            {/* Tab bar */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("listing_active")}
                className={`flex flex-1 items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  activeTab === "listing_active"
                    ? "border-b-2 border-brand-primary text-brand-primary"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                Listing Active
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    activeTab === "listing_active"
                      ? "bg-brand-primary text-white"
                      : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  {listingActiveCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("under_offer")}
                className={`flex flex-1 items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  activeTab === "under_offer"
                    ? "border-b-2 border-brand-primary text-brand-primary"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                Under Offer
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    activeTab === "under_offer"
                      ? "bg-brand-primary text-white"
                      : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  {underOfferCount}
                </span>
              </button>
            </div>

            {/* Sale list */}
            <div className="flex-1 overflow-y-auto p-3">
              {tabProgressions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-xs text-neutral-400">No sales in this view</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {tabProgressions.map((p) => (
                    <SaleListCard
                      key={p.id}
                      progression={p}
                      isSelected={visibleSelected?.id === p.id}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---- RIGHT PANE: detail ---- */}
          <div className="hidden flex-1 overflow-hidden md:flex md:flex-col">
            {visibleSelected ? (
              <div className="h-full overflow-y-auto p-5">
                <DetailPanel
                  progression={visibleSelected}
                  onViewChain={() => setChainDialogOpen(true)}
                />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-neutral-400">
                  Select a sale to view progression
                </p>
                <p className="text-xs text-neutral-300">
                  Click any sale in the list to see its timeline
                </p>
              </div>
            )}
          </div>
        </div>
      </DndContext>

      {/* Chain detail dialog */}
      {visibleSelected?.chain_risk && (
        <ChainDetailDialog
          chainGroupId={visibleSelected.chain_risk.chain_group_id}
          open={chainDialogOpen}
          onClose={() => setChainDialogOpen(false)}
        />
      )}

      {/* Mobile fallback: full dialog */}
      <div className="md:hidden">
        <ProgressionDialog
          progression={selected}
          open={mobileDialogOpen}
          onClose={() => setMobileDialogOpen(false)}
        />
      </div>
    </>
  );
}
