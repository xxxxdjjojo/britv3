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
import { LeadCard } from "./LeadCard";
import type { AgentLead, LeadStage, LeadSource } from "@/types/agent";
import { LEAD_STAGES, LEAD_SOURCES, LEAD_STAGE_LABELS } from "@/types/agent";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Droppable column wrapper
// ---------------------------------------------------------------------------

function KanbanColumn(
  props: Readonly<{
    stage: LeadStage;
    leads: AgentLead[];
  }>
) {
  const { stage, leads } = props;
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col min-w-[260px] w-[260px] shrink-0 rounded-xl border bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700",
        isOver ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {LEAD_STAGE_LABELS[stage]}
        </h3>
        <span className="inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
            No leads
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Lead dialog (inline, no Shadcn Dialog dependency)
// ---------------------------------------------------------------------------

function AddLeadDialog(
  props: Readonly<{
    open: boolean;
    onClose: () => void;
    onCreated: (lead: AgentLead) => void;
  }>
) {
  const { open, onClose, onCreated } = props;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      contact_name: fd.get("contact_name") as string,
      contact_email: (fd.get("contact_email") as string) || undefined,
      contact_phone: (fd.get("contact_phone") as string) || undefined,
      source: (fd.get("source") as LeadSource) || undefined,
      stage: "new_enquiry" as const,
    };

    try {
      const res = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create lead");
      }

      const data = await res.json();
      onCreated(data.lead as AgentLead);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Add New Lead
        </h2>
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              name="contact_name"
              required
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              name="contact_email"
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              name="contact_phone"
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              placeholder="07700 123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source
            </label>
            <select
              name="source"
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="">Select source...</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {formatLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Kanban component
// ---------------------------------------------------------------------------

export function LeadPipelineKanban(
  props: Readonly<{ initialLeads: Record<LeadStage, AgentLead[]> }>
) {
  const { initialLeads } = props;
  const [leadsByStage, setLeadsByStage] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Find active lead for DragOverlay
  const activeLead = useMemo(() => {
    if (!activeId) return null;
    for (const stage of LEAD_STAGES) {
      const found = leadsByStage[stage].find((l) => l.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, leadsByStage]);

  // Filtered leads by search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leadsByStage;
    const q = searchQuery.toLowerCase();
    const result = {} as Record<LeadStage, AgentLead[]>;
    for (const stage of LEAD_STAGES) {
      result[stage] = leadsByStage[stage].filter(
        (l) =>
          l.contact_name.toLowerCase().includes(q) ||
          (l.contact_email?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [searchQuery, leadsByStage]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = active.id as string;

      // Determine destination stage: the over target could be a column (stage)
      // or another card. If it's a card, find which stage that card is in.
      let destStage: LeadStage | null = null;

      if (LEAD_STAGES.includes(over.id as LeadStage)) {
        destStage = over.id as LeadStage;
      } else {
        // over.id is a card id — find its stage
        for (const stage of LEAD_STAGES) {
          if (leadsByStage[stage].some((l) => l.id === over.id)) {
            destStage = stage;
            break;
          }
        }
      }

      if (!destStage) return;

      // Find source stage
      let srcStage: LeadStage | null = null;
      let draggedLead: AgentLead | null = null;
      for (const stage of LEAD_STAGES) {
        const lead = leadsByStage[stage].find((l) => l.id === draggedId);
        if (lead) {
          srcStage = stage;
          draggedLead = lead;
          break;
        }
      }

      if (!srcStage || !draggedLead || srcStage === destStage) return;

      // Optimistic update
      const prevState = { ...leadsByStage };
      setLeadsByStage((prev) => {
        const next = { ...prev };
        next[srcStage] = prev[srcStage].filter((l) => l.id !== draggedId);
        const updated = { ...draggedLead, stage: destStage } as AgentLead;
        next[destStage] = [updated, ...prev[destStage]];
        return next;
      });

      // Persist via API
      try {
        const res = await fetch("/api/agent/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draggedId, stage: destStage }),
        });
        if (!res.ok) throw new Error("API error");
      } catch {
        // Revert on failure
        setLeadsByStage(prevState);
      }
    },
    [leadsByStage],
  );

  const handleLeadCreated = useCallback((lead: AgentLead) => {
    setLeadsByStage((prev) => ({
      ...prev,
      [lead.stage]: [lead, ...prev[lead.stage]],
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Lead Pipeline
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag leads between stages to update their status
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 sm:w-64 rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          />
          <button
            onClick={() => setAddDialogOpen(true)}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={filteredLeads[stage]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <LeadCard lead={activeLead} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Lead dialog */}
      <AddLeadDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onCreated={handleLeadCreated}
      />
    </div>
  );
}
