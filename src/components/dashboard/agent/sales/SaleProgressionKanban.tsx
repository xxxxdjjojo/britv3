"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { ChainRiskBadge } from "@/components/dashboard/agent/sales/ChainRiskBadge";
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
// SortableCard
// --------------------------------------------------------------------------

function SortableCard({
  progression,
  onOpen,
}: Readonly<{
  progression: AgentSaleProgressionWithRisk;
  onOpen: (p: AgentSaleProgressionWithRisk) => void;
}>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: progression.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const days = getDaysInStage(progression.updated_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing"
      onClick={() => onOpen(progression)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(progression)}
      role="button"
      tabIndex={0}
    >
      <p className="truncate text-xs font-medium text-foreground">
        {progression.property_id.substring(0, 8)}…
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {STAGE_LABELS[progression.stage].label}
        </Badge>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${healthColour(days)}`}
        >
          {days}d
        </span>
      </div>
      {progression.chain_risk && (
        <div className="mt-1.5">
          <ChainRiskBadge risk={progression.chain_risk} />
        </div>
      )}
      {progression.expected_completion_date && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          ETA:{" "}
          {new Date(progression.expected_completion_date).toLocaleDateString(
            "en-GB",
          )}
        </p>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// DroppableColumn
// --------------------------------------------------------------------------

function DroppableColumn({
  stage,
  progressions,
  onOpen,
}: Readonly<{
  stage: SaleStage;
  progressions: AgentSaleProgressionWithRisk[];
  onOpen: (p: AgentSaleProgressionWithRisk) => void;
}>) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = STAGE_LABELS[stage];

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[200px] max-w-[240px] flex-shrink-0 flex-col gap-2 rounded-xl border p-3 transition-colors ${
        isOver ? "border-brand-primary bg-brand-primary/5" : "bg-muted/40"
      }`}
    >
      {/* Column header */}
      <div className="mb-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">{meta.label}</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {progressions.length}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{meta.desc}</p>
      </div>

      {/* Cards */}
      <SortableContext
        items={progressions.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {progressions.map((p) => (
            <SortableCard key={p.id} progression={p} onOpen={onOpen} />
          ))}
          {progressions.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-muted py-6 text-center">
              <p className="text-[10px] text-muted-foreground">No sales</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// --------------------------------------------------------------------------
// Detail dialog
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
// Main Kanban component
// --------------------------------------------------------------------------

type ProgressionsMap = Partial<Record<SaleStage, AgentSaleProgressionWithRisk[]>>;

export function SaleProgressionKanban({
  initialProgressions,
}: Readonly<{
  initialProgressions: ProgressionsMap;
}>) {
  const [progressions, setProgressions] =
    useState<ProgressionsMap>(initialProgressions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AgentSaleProgressionWithRisk | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Find a progression by id across all stages
  function findProgression(id: string): AgentSaleProgressionWithRisk | undefined {
    for (const stage of SALE_STAGES) {
      const found = progressions[stage]?.find((p) => p.id === id);
      if (found) return found;
    }
    return undefined;
  }

  // Find which stage a progression currently lives in
  function findStage(id: string): SaleStage | undefined {
    for (const stage of SALE_STAGES) {
      if (progressions[stage]?.some((p) => p.id === id)) return stage;
    }
    return undefined;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const sourceStage = findStage(active.id as string);
    // over.id could be either a stage key or another card id
    const targetStage = (
      SALE_STAGES.includes(over.id as SaleStage)
        ? over.id
        : findStage(over.id as string)
    ) as SaleStage | undefined;

    if (!sourceStage || !targetStage || sourceStage === targetStage) return;

    const progression = findProgression(active.id as string);
    if (!progression) return;

    // Optimistically update state
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
      // Revert on error
      setProgressions(prev);
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    }
  }

  function openDetail(p: AgentSaleProgressionWithRisk) {
    setSelected(p);
    setDialogOpen(true);
  }

  const activeProgression = activeId ? findProgression(activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {SALE_STAGES.map((stage) => (
            <DroppableColumn
              key={stage}
              stage={stage}
              progressions={progressions[stage] ?? []}
              onOpen={openDetail}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProgression ? (
            <div className="w-[220px] cursor-grabbing rounded-lg border bg-card p-3 shadow-lg">
              <p className="truncate text-xs font-medium text-foreground">
                {activeProgression.property_id.substring(0, 8)}…
              </p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {STAGE_LABELS[activeProgression.stage].label}
              </Badge>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ProgressionDialog
        progression={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
