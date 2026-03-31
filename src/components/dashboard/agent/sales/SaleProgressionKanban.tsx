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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Handshake,
  FileText,
  Scale,
  Search as SearchIcon,
  Building,
  Landmark,
  PenTool,
  PartyPopper,
} from "lucide-react";
import type { AgentSaleProgressionWithRisk, SaleStage } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";
import { ChainRiskBadge } from "@/components/dashboard/agent/sales/ChainRiskBadge";
import { ChainDetailDialog } from "@/components/dashboard/agent/sales/ChainDetailDialog";

// --------------------------------------------------------------------------
// Stage metadata
// --------------------------------------------------------------------------

const STAGE_LABELS: Record<SaleStage, { label: string; desc: string; Icon: React.ElementType }> = {
  offer_accepted: {
    label: "Offer Accepted",
    desc: "Memo of sale pending",
    Icon: Handshake,
  },
  memorandum_of_sale: {
    label: "Memo of Sale",
    desc: "Memorandum issued",
    Icon: FileText,
  },
  solicitors_instructed: {
    label: "Solicitors",
    desc: "Both parties instructed",
    Icon: Scale,
  },
  searches: { label: "Searches", desc: "Local searches underway", Icon: SearchIcon },
  survey: { label: "Survey", desc: "Property survey booked", Icon: Building },
  mortgage: { label: "Mortgage", desc: "Mortgage offer received", Icon: Landmark },
  exchange: { label: "Exchange", desc: "Contracts exchanged", Icon: PenTool },
  completion: { label: "Completion", desc: "Completion day", Icon: PartyPopper },
};

// --------------------------------------------------------------------------
// Health colour helper
// --------------------------------------------------------------------------

function getDaysInStage(updatedAt: string): number {
  return Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function healthConfig(days: number): { pill: string; label: string } {
  if (days <= 7)
    return { pill: "bg-success-light text-success", label: `${days}d` };
  if (days <= 14)
    return { pill: "bg-warning-light text-warning", label: `${days}d` };
  return { pill: "bg-error-light text-error", label: `${days}d` };
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
    opacity: isDragging ? 0.35 : 1,
  };

  const days = getDaysInStage(progression.updated_at);
  const health = healthConfig(days);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md active:cursor-grabbing"
      onClick={() => onOpen(progression)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(progression)}
      role="button"
      tabIndex={0}
    >
      <p className="truncate text-xs font-semibold text-foreground">
        {progression.property_id.substring(0, 8)}…
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-brand-primary-lighter px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
          {STAGE_LABELS[progression.stage].label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${health.pill}`}
        >
          {health.label}
        </span>
      </div>
      {progression.chain_risk && (
        <div className="mt-2">
          <ChainRiskBadge risk={progression.chain_risk} />
        </div>
      )}
      {progression.expected_completion_date && (
        <p className="mt-2 text-[10px] text-neutral-400">
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
      className={`flex min-w-[210px] max-w-[240px] flex-shrink-0 flex-col gap-2 rounded-2xl p-3 transition-all ${
        isOver
          ? "bg-brand-primary-lighter shadow-md ring-2 ring-brand-primary/30"
          : "bg-muted/20"
      }`}
    >
      {/* Column header */}
      <div className="mb-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <meta.Icon className="size-3.5 text-neutral-500 shrink-0" strokeWidth={1.25} />
            <p className="text-xs font-semibold text-foreground">{meta.label}</p>
          </div>
          <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-neutral-500 shadow-sm ring-1 ring-border/40">
            {progressions.length}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-neutral-400">{meta.desc}</p>
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
            <div className="rounded-xl border-[1.5px] border-dashed border-border py-8 text-center">
              <p className="text-[10px] text-neutral-400">Drop here</p>
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

  const days = getDaysInStage(progression.updated_at);
  const health = healthConfig(days);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
            Sale Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Stage pill + health */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-lighter px-3 py-1 text-xs font-semibold text-brand-primary">
              {(() => { const { Icon } = STAGE_LABELS[progression.stage]; return <Icon className="size-3 shrink-0" strokeWidth={1.25} />; })()}
              {STAGE_LABELS[progression.stage].label}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${health.pill}`}
            >
              {days}d in stage
            </span>
          </div>

          {/* IDs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">
                Property ID
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-700">
                {progression.property_id}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">
                Offer ID
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-700">
                {progression.offer_id}
              </p>
            </div>
          </div>

          {/* ETA */}
          <div>
            <Label className="text-xs font-medium text-neutral-500">
              Expected Completion Date
            </Label>
            <Input
              type="date"
              defaultValue={progression.expected_completion_date ?? ""}
              readOnly
              className="mt-1.5 rounded-xl bg-muted/40 text-sm"
            />
          </div>

          {progression.solicitor_buyer && (
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Buyer Solicitor
              </p>
              <div className="space-y-1 font-mono text-xs text-neutral-700">
                {Object.entries(progression.solicitor_buyer).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-neutral-400">{k}:</span>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-medium text-neutral-500">Notes</Label>
            <Textarea
              defaultValue={progression.notes ?? ""}
              readOnly
              rows={3}
              className="mt-1.5 resize-none rounded-xl bg-muted/40 text-sm"
            />
          </div>

          {progression.chain_risk && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setChainDialogOpen(true)}
              >
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
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
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
  const [selected, setSelected] = useState<AgentSaleProgressionWithRisk | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function findProgression(
    id: string,
  ): AgentSaleProgressionWithRisk | undefined {
    for (const stage of SALE_STAGES) {
      const found = progressions[stage]?.find((p) => p.id === id);
      if (found) return found;
    }
    return undefined;
  }

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
      toast.error(
        err instanceof Error ? err.message : "Failed to update stage",
      );
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
        <div className="flex gap-3 overflow-x-auto pb-6">
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
            <div className="w-[220px] cursor-grabbing rounded-xl bg-card p-3.5 shadow-xl ring-1 ring-border/60">
              <p className="truncate text-xs font-semibold text-foreground">
                {activeProgression.property_id.substring(0, 8)}…
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-primary-lighter px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                {(() => { const { Icon } = STAGE_LABELS[activeProgression.stage]; return <Icon className="size-2.5 shrink-0" strokeWidth={1.25} />; })()}
                {STAGE_LABELS[activeProgression.stage].label}
              </span>
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
