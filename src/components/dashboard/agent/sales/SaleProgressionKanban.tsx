"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";
import { CalendarDays, Clock, Building2, User } from "lucide-react";

// ============================================================================
// Constants and helpers
// ============================================================================

const STAGE_LABELS: Record<SaleStage, string> = {
  offer_accepted: "Offer Accepted",
  memorandum_of_sale: "Memorandum of Sale",
  solicitors_instructed: "Solicitors Instructed",
  searches: "Searches",
  survey: "Survey",
  mortgage: "Mortgage",
  exchange: "Exchange",
  completion: "Completion",
};

/** Days since updated_at */
function daysInStage(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function healthClass(days: number): string {
  if (days <= 7) return "bg-green-500";
  if (days <= 14) return "bg-amber-500";
  return "bg-red-500";
}

function healthTextClass(days: number): string {
  if (days <= 7) return "text-green-700 dark:text-green-400";
  if (days <= 14) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatGBP(pence: number | null | undefined): string {
  if (pence == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

/** Returns index of stage in SALE_STAGES */
function stageIndex(stage: SaleStage): number {
  return SALE_STAGES.indexOf(stage);
}

/** Adjacent-only drop target detection */
function isAdjacentStage(from: SaleStage, to: SaleStage): boolean {
  return Math.abs(stageIndex(from) - stageIndex(to)) === 1;
}

// ============================================================================
// Draggable card
// ============================================================================

type CardProps = Readonly<{
  progression: AgentSaleProgression;
  isDragging?: boolean;
  onClick: () => void;
}>;

function ProgressionCard({ progression, isDragging, onClick }: CardProps) {
  const days = daysInStage(progression.updated_at);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: progression.id,
    data: { progression },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card border rounded-lg p-3 cursor-grab space-y-2 select-none hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={(e) => {
        // Don't open panel if currently dragging
        if (!transform) onClick();
        e.stopPropagation();
      }}
    >
      {/* Health indicator bar */}
      <div className={`h-1 rounded-full ${healthClass(days)}`} />

      {/* Property address */}
      <div className="flex items-start gap-1.5">
        <Building2 className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <span className="text-xs font-medium line-clamp-2 leading-tight">
          {progression.property_id.slice(0, 8)}...
        </span>
      </div>

      {/* Buyer name from offer details (property_id used as fallback) */}
      <div className="flex items-center gap-1.5">
        <User className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground truncate">
          ID: {progression.offer_id.slice(0, 8)}...
        </span>
      </div>

      {/* Expected completion */}
      {progression.expected_completion_date && (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">
            {formatDate(progression.expected_completion_date)}
          </span>
        </div>
      )}

      {/* Days in stage */}
      <div className="flex items-center gap-1.5">
        <Clock className="size-3.5 text-muted-foreground shrink-0" />
        <span className={`text-xs font-medium ${healthTextClass(days)}`}>
          {days}d in stage
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Droppable column
// ============================================================================

type ColumnProps = Readonly<{
  stage: SaleStage;
  progressions: AgentSaleProgression[];
  isDragActive: boolean;
  activeFromStage: SaleStage | null;
  onCardClick: (p: AgentSaleProgression) => void;
}>;

function KanbanColumn({
  stage,
  progressions,
  isDragActive,
  activeFromStage,
  onCardClick,
}: ColumnProps) {
  const isValidTarget =
    !isDragActive ||
    activeFromStage === null ||
    isAdjacentStage(activeFromStage, stage) ||
    activeFromStage === stage;

  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      className={`flex flex-col min-w-[200px] w-[200px] transition-opacity ${
        isDragActive && !isValidTarget ? "opacity-40" : "opacity-100"
      }`}
    >
      {/* Column header */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-b font-medium text-sm ${
          isOver && isValidTarget
            ? "bg-primary/10 border-primary/30"
            : "bg-muted/60"
        }`}
      >
        <span className="truncate">{STAGE_LABELS[stage]}</span>
        <span className="ml-2 shrink-0 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">
          {progressions.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors ${
          isOver && isValidTarget
            ? "bg-primary/5 border-primary/30"
            : "bg-muted/20"
        }`}
      >
        {progressions.map((p) => (
          <ProgressionCard
            key={p.id}
            progression={p}
            onClick={() => onCardClick(p)}
          />
        ))}
        {progressions.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Detail sheet
// ============================================================================

type DetailSheetProps = Readonly<{
  progression: AgentSaleProgression | null;
  onClose: () => void;
  onSave: (id: string, patch: { notes?: string; expected_completion_date?: string }) => Promise<void>;
}>;

function DetailSheet({ progression, onClose, onSave }: DetailSheetProps) {
  const [notes, setNotes] = useState(progression?.notes ?? "");
  const [completionDate, setCompletionDate] = useState(
    progression?.expected_completion_date?.slice(0, 10) ?? "",
  );
  const [saving, setSaving] = useState(false);

  if (!progression) return null;

  const solicitorBuyer = progression.solicitor_buyer as {
    name?: string;
    email?: string;
    phone?: string;
  };
  const solicitorSeller = progression.solicitor_seller as {
    name?: string;
    email?: string;
    phone?: string;
  };

  async function handleNotesBlur() {
    if (!progression) return;
    setSaving(true);
    try {
      await onSave(progression.id, { notes });
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!progression) return;
    setCompletionDate(e.target.value);
    try {
      await onSave(progression.id, {
        expected_completion_date: e.target.value || undefined,
      });
    } catch {
      toast.error("Failed to save completion date");
    }
  }

  return (
    <Sheet open={!!progression} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sale Progression</SheetTitle>
          <SheetDescription>
            Stage: {STAGE_LABELS[progression.stage]}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* IDs */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Reference</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property ID</span>
                <span className="font-mono text-xs">{progression.property_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offer ID</span>
                <span className="font-mono text-xs">{progression.offer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(progression.created_at)}</span>
              </div>
            </div>
          </section>

          {/* Buyer solicitor */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Buyer Solicitor</h3>
            {(solicitorBuyer.name || solicitorBuyer.email || solicitorBuyer.phone) ? (
              <div className="space-y-1 text-sm">
                {solicitorBuyer.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{solicitorBuyer.name}</span>
                  </div>
                )}
                {solicitorBuyer.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${solicitorBuyer.email}`} className="text-primary hover:underline">
                      {solicitorBuyer.email}
                    </a>
                  </div>
                )}
                {solicitorBuyer.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{solicitorBuyer.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not yet recorded</p>
            )}
          </section>

          {/* Seller solicitor */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Seller Solicitor</h3>
            {(solicitorSeller.name || solicitorSeller.email || solicitorSeller.phone) ? (
              <div className="space-y-1 text-sm">
                {solicitorSeller.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{solicitorSeller.name}</span>
                  </div>
                )}
                {solicitorSeller.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${solicitorSeller.email}`} className="text-primary hover:underline">
                      {solicitorSeller.email}
                    </a>
                  </div>
                )}
                {solicitorSeller.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{solicitorSeller.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not yet recorded</p>
            )}
          </section>

          {/* Expected completion date */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Expected Completion Date</h3>
            <input
              type="date"
              value={completionDate}
              onChange={handleDateChange}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-semibold mb-2">
              Notes
              {saving && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  Saving...
                </span>
              )}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about this progression..."
              rows={5}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Stage info */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Current Stage</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{STAGE_LABELS[progression.stage]}</Badge>
              <span className="text-sm text-muted-foreground">
                since {formatDate(progression.updated_at)}
              </span>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Main Kanban board
// ============================================================================

type SaleProgressionKanbanProps = Readonly<{
  initialProgressions: Record<SaleStage, AgentSaleProgression[]>;
}>;

export function SaleProgressionKanban({
  initialProgressions,
}: SaleProgressionKanbanProps) {
  const [grouped, setGrouped] = useState(initialProgressions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFromStage, setActiveFromStage] = useState<SaleStage | null>(null);
  const [selectedProgression, setSelectedProgression] =
    useState<AgentSaleProgression | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // Find active progression for DragOverlay
  const activeProgression = activeId
    ? Object.values(grouped)
        .flat()
        .find((p) => p.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setActiveId(id);

    // Determine which stage this card is in
    for (const [stage, progressions] of Object.entries(grouped)) {
      if (progressions.some((p) => p.id === id)) {
        setActiveFromStage(stage as SaleStage);
        break;
      }
    }
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      setActiveFromStage(null);

      const { active, over } = event;
      if (!over) return;

      const draggedId = active.id as string;
      const targetStage = over.id as SaleStage;

      // Find current stage
      let currentStage: SaleStage | null = null;
      let draggedProgression: AgentSaleProgression | null = null;

      for (const [stage, progressions] of Object.entries(grouped)) {
        const found = progressions.find((p) => p.id === draggedId);
        if (found) {
          currentStage = stage as SaleStage;
          draggedProgression = found;
          break;
        }
      }

      if (!currentStage || !draggedProgression) return;
      if (currentStage === targetStage) return;

      // Validate adjacency
      if (!isAdjacentStage(currentStage, targetStage)) {
        toast.error("Can only move to adjacent stages (one step forward or backward)");
        return;
      }

      // Optimistic update
      const prevGrouped = grouped;
      setGrouped((prev) => {
        const next = { ...prev };
        next[currentStage!] = prev[currentStage!].filter(
          (p) => p.id !== draggedId,
        );
        next[targetStage] = [
          { ...draggedProgression!, stage: targetStage, updated_at: new Date().toISOString() },
          ...prev[targetStage],
        ];
        return next;
      });

      try {
        const res = await fetch("/api/agent/sales", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draggedId, stage: targetStage }),
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to update stage");
        }
      } catch (error) {
        // Revert
        setGrouped(prevGrouped);
        toast.error(
          error instanceof Error ? error.message : "Failed to update stage",
        );
      }
    },
    [grouped],
  );

  async function handleSaveDetails(
    id: string,
    patch: { notes?: string; expected_completion_date?: string },
  ) {
    const res = await fetch("/api/agent/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error ?? "Failed to save");
    }

    // Update local state
    const { progression: updated } = (await res.json()) as {
      progression: AgentSaleProgression;
    };

    setGrouped((prev) => {
      const next = { ...prev };
      for (const stage of SALE_STAGES) {
        next[stage] = prev[stage].map((p) => (p.id === id ? updated : p));
      }
      return next;
    });

    if (selectedProgression?.id === id) {
      setSelectedProgression(updated);
    }
  }

  const totalCount = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <>
      {/* Summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        {totalCount} active sale{totalCount !== 1 ? "s" : ""} in progression
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[1600px]">
            {SALE_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                progressions={grouped[stage]}
                isDragActive={activeId !== null}
                activeFromStage={activeFromStage}
                onCardClick={(p) => setSelectedProgression(p)}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeProgression ? (
            <div className="bg-card border rounded-lg p-3 shadow-2xl opacity-90 w-[196px] space-y-2">
              <div
                className={`h-1 rounded-full ${healthClass(
                  daysInStage(activeProgression.updated_at),
                )}`}
              />
              <p className="text-xs font-medium">
                {activeProgression.property_id.slice(0, 8)}...
              </p>
              <p className="text-xs text-muted-foreground">
                {daysInStage(activeProgression.updated_at)}d in stage
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Detail sheet */}
      <DetailSheet
        progression={selectedProgression}
        onClose={() => setSelectedProgression(null)}
        onSave={handleSaveDetails}
      />
    </>
  );
}
