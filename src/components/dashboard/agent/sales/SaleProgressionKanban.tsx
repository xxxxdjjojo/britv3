"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { AgentSaleProgression, SaleStage } from "@/types/agent";
import { SALE_STAGES } from "@/types/agent";
import { ALLOWED_TRANSITIONS } from "@/services/agent/agent-sale-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function daysInStage(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function healthColor(days: number): { border: string; bg: string } {
  if (days <= 7) {
    return { border: "border-l-green-500", bg: "bg-green-50 dark:bg-green-950/30" };
  }
  if (days <= 14) {
    return { border: "border-l-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" };
  }
  return { border: "border-l-red-500", bg: "bg-red-50 dark:bg-red-950/30" };
}

// ---------------------------------------------------------------------------
// Sale Card
// ---------------------------------------------------------------------------

function SaleCard(
  props: Readonly<{
    progression: AgentSaleProgression;
    isDragOverlay?: boolean;
    onClick?: () => void;
  }>
) {
  const { progression, isDragOverlay, onClick } = props;
  const days = daysInStage(progression.updated_at);
  const colors = healthColor(days);

  return (
    <div
      onClick={onClick}
      className={[
        "rounded-lg border-l-4 border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
        colors.border,
        colors.bg,
        isDragOverlay ? "rotate-2 shadow-lg" : "",
      ].join(" ")}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {progression.property_id
          ? `Property ${progression.property_id.slice(0, 8)}...`
          : "No property"}
      </p>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{days}d in stage</span>
        {progression.expected_completion_date && (
          <span>
            Due {new Date(progression.expected_completion_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Dialog
// ---------------------------------------------------------------------------

function SaleDetailDialog(
  props: Readonly<{
    progression: AgentSaleProgression;
    onClose: () => void;
  }>
) {
  const { progression, onClose } = props;
  const days = daysInStage(progression.updated_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sale Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Property</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {progression.property_id ?? "N/A"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Stage</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {STAGE_LABELS[progression.stage]}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Days in Stage</dt>
            <dd className="text-gray-900 dark:text-gray-100">{days}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Expected Completion</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {progression.expected_completion_date
                ? new Date(progression.expected_completion_date).toLocaleDateString("en-GB")
                : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Notes</dt>
            <dd className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {progression.notes ?? "No notes"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable column wrapper
// ---------------------------------------------------------------------------

function KanbanColumn(
  props: Readonly<{
    stage: SaleStage;
    progressions: AgentSaleProgression[];
    onCardClick: (p: AgentSaleProgression) => void;
  }>
) {
  const { stage, progressions, onCardClick } = props;
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col min-w-[240px] w-[240px] shrink-0 rounded-xl border bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700",
        isOver ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
          {STAGE_LABELS[stage]}
        </h3>
        <span className="inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          {progressions.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext
          items={progressions.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {progressions.map((prog) => (
            <SaleCard
              key={prog.id}
              progression={prog}
              onClick={() => onCardClick(prog)}
            />
          ))}
        </SortableContext>
        {progressions.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
            No sales
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Kanban component
// ---------------------------------------------------------------------------

export function SaleProgressionKanban(
  props: Readonly<{ initialProgressions: Record<SaleStage, AgentSaleProgression[]> }>
) {
  const { initialProgressions } = props;
  const [byStage, setByStage] = useState(initialProgressions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedProg, setSelectedProg] = useState<AgentSaleProgression | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Find active progression for DragOverlay
  const activeProg = useMemo(() => {
    if (!activeId) return null;
    for (const stage of SALE_STAGES) {
      const found = byStage[stage].find((p) => p.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, byStage]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = active.id as string;

      // Determine destination stage
      let destStage: SaleStage | null = null;

      if ((SALE_STAGES as readonly string[]).includes(over.id as string)) {
        destStage = over.id as SaleStage;
      } else {
        for (const stage of SALE_STAGES) {
          if (byStage[stage].some((p) => p.id === over.id)) {
            destStage = stage;
            break;
          }
        }
      }

      if (!destStage) return;

      // Find source stage
      let srcStage: SaleStage | null = null;
      let draggedProg: AgentSaleProgression | null = null;
      for (const stage of SALE_STAGES) {
        const prog = byStage[stage].find((p) => p.id === draggedId);
        if (prog) {
          srcStage = stage;
          draggedProg = prog;
          break;
        }
      }

      if (!srcStage || !draggedProg || srcStage === destStage) return;

      // Validate transition using ALLOWED_TRANSITIONS
      const allowed = ALLOWED_TRANSITIONS[srcStage];
      if (!allowed.includes(destStage)) {
        alert(
          `Cannot move from "${STAGE_LABELS[srcStage]}" to "${STAGE_LABELS[destStage]}". Only adjacent stages are allowed.`,
        );
        return;
      }

      // Optimistic update
      const prevState = { ...byStage };
      setByStage((prev) => {
        const next = { ...prev };
        next[srcStage] = prev[srcStage].filter((p) => p.id !== draggedId);
        const updated = { ...draggedProg, stage: destStage } as AgentSaleProgression;
        next[destStage] = [updated, ...prev[destStage]];
        return next;
      });

      // Persist via API
      try {
        const res = await fetch("/api/agent/sales", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draggedId, stage: destStage }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "API error");
        }
      } catch {
        // Revert on failure
        setByStage(prevState);
      }
    },
    [byStage],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Sale Progression
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track sales from accepted offer to completion. Drag cards between adjacent stages.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-500" /> 0-7 days
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-amber-500" /> 8-14 days
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-500" /> 14+ days
        </span>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {SALE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              progressions={byStage[stage]}
              onCardClick={setSelectedProg}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProg ? (
            <SaleCard progression={activeProg} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Detail dialog */}
      {selectedProg && (
        <SaleDetailDialog
          progression={selectedProg}
          onClose={() => setSelectedProg(null)}
        />
      )}
    </div>
  );
}
