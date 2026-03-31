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
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { LeadCard } from "./LeadCard";
import type { AgentLead, LeadStage } from "@/types/agent";
import { LEAD_STAGES, LEAD_SOURCES } from "@/types/agent";

type Props = Readonly<{
  initialLeads: Partial<Record<LeadStage, AgentLead[]>>;
}>;

const STAGE_LABELS: Record<LeadStage, string> = {
  new_enquiry: "New Enquiry",
  qualified: "Qualified",
  viewing_booked: "Viewing Booked",
  offer_made: "Offer Made",
  closed: "Closed",
};

// Each column gets a slightly different surface shade per the design system hierarchy
const STAGE_BG: Record<LeadStage, string> = {
  new_enquiry: "bg-neutral-50",
  qualified: "bg-blue-50/60",
  viewing_booked: "bg-amber-50/60",
  offer_made: "bg-emerald-50/60",
  closed: "bg-neutral-100/80",
};

// Status pill colors for column header
const STAGE_PILL: Record<LeadStage, string> = {
  new_enquiry: "bg-neutral-200 text-neutral-700",
  qualified: "bg-blue-100 text-blue-700",
  viewing_booked: "bg-amber-100 text-amber-700",
  offer_made: "bg-emerald-100 text-emerald-700",
  closed: "bg-neutral-200 text-neutral-600",
};

function DroppableColumn({
  stage,
  children,
}: Readonly<{
  stage: LeadStage;
  children: React.ReactNode;
}>) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-xl p-2.5 transition-colors duration-150 ${STAGE_BG[stage]} ${
        isOver ? "ring-2 ring-brand-primary/40 ring-inset" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function LeadPipelineKanban({ initialLeads }: Props) {
  const [leads, setLeads] =
    useState<Partial<Record<LeadStage, AgentLead[]>>>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadName, setAddLeadName] = useState("");
  const [addLeadEmail, setAddLeadEmail] = useState("");
  const [addLeadSource, setAddLeadSource] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const activeLeadData = activeId
    ? Object.values(leads)
        .flat()
        .find((l) => l?.id === activeId)
    : null;

  function filterLeads(stageLeads: AgentLead[]): AgentLead[] {
    if (!searchQuery.trim()) return stageLeads;
    const q = searchQuery.toLowerCase();
    return stageLeads.filter(
      (l) =>
        l.contact_name.toLowerCase().includes(q) ||
        (l.contact_email ?? "").toLowerCase().includes(q),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Determine target stage — over.id could be a stage (column) or another lead id
    let newStage: LeadStage | null = null;
    if ((LEAD_STAGES as readonly string[]).includes(overId)) {
      newStage = overId as LeadStage;
    } else {
      for (const stage of LEAD_STAGES) {
        if ((leads[stage] ?? []).some((l) => l.id === overId)) {
          newStage = stage;
          break;
        }
      }
    }

    if (!newStage) return;

    let currentStage: LeadStage | null = null;
    for (const stage of LEAD_STAGES) {
      if ((leads[stage] ?? []).some((l) => l.id === leadId)) {
        currentStage = stage;
        break;
      }
    }

    if (!currentStage || currentStage === newStage) return;

    // Optimistic update
    setLeads((prev) => {
      const updated = { ...prev };
      for (const stage of LEAD_STAGES) {
        const stageLeads = [...(updated[stage] ?? [])];
        const leadIndex = stageLeads.findIndex((l) => l.id === leadId);
        if (leadIndex !== -1) {
          const [lead] = stageLeads.splice(leadIndex, 1);
          updated[newStage!] = [
            ...(updated[newStage!] ?? []),
            { ...lead, stage: newStage! },
          ];
          updated[stage] = stageLeads;
          break;
        }
      }
      return updated;
    });

    try {
      await fetch("/api/agent/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, stage: newStage }),
      });
    } catch {
      setLeads(initialLeads);
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!addLeadName.trim()) return;
    setIsSubmitting(true);
    try {
      const body: Record<string, string> = { contact_name: addLeadName };
      if (addLeadEmail) body.contact_email = addLeadEmail;
      if (addLeadSource) body.source = addLeadSource;

      const res = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const newLead = (await res.json()) as AgentLead;
        setLeads((prev) => ({
          ...prev,
          new_enquiry: [newLead, ...(prev.new_enquiry ?? [])],
        }));
        setAddLeadName("");
        setAddLeadEmail("");
        setAddLeadSource("");
        setAddLeadOpen(false);
      } else {
        toast.error("Failed to add lead");
      }
    } catch {
      toast.error("Failed to add lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalLeads = Object.values(leads).flat().length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search leads..."
            className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground hidden sm:block">
          {totalLeads} {totalLeads === 1 ? "lead" : "leads"} total
        </div>

        <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-primary hover:bg-brand-primary-light text-white gap-2 shrink-0">
              <UserPlus className="size-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight text-[#1a1c1c]">
                Add New Lead
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="lead-name" className="text-sm font-medium text-[#1a1c1c]">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lead-name"
                  placeholder="Contact name"
                  value={addLeadName}
                  onChange={(e) => setAddLeadName(e.target.value)}
                  required
                  className="bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email" className="text-sm font-medium text-[#1a1c1c]">
                  Email
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={addLeadEmail}
                  onChange={(e) => setAddLeadEmail(e.target.value)}
                  className="bg-neutral-50 border-neutral-200 focus:bg-white focus:border-brand-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-source" className="text-sm font-medium text-[#1a1c1c]">
                  Source
                </Label>
                <Select value={addLeadSource} onValueChange={(v) => setAddLeadSource(v ?? "")}>
                  <SelectTrigger
                    id="lead-source"
                    className="bg-neutral-50 border-neutral-200"
                  >
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src.charAt(0).toUpperCase() +
                          src.slice(1).replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddLeadOpen(false)}
                  className="border-neutral-200 text-[#1a1c1c] hover:bg-neutral-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-primary hover:bg-brand-primary-light text-white"
                >
                  {isSubmitting ? "Adding..." : "Add Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => {
            const columnLeads = filterLeads(leads[stage] ?? []);
            const totalCount = (leads[stage] ?? []).length;
            return (
              <div key={stage} className="flex-shrink-0 w-64">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold text-[#1a1c1c] uppercase tracking-wide">
                    {STAGE_LABELS[stage]}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_PILL[stage]}`}>
                    {totalCount}
                  </span>
                </div>
                <DroppableColumn stage={stage}>
                  <SortableContext
                    items={columnLeads.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {columnLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} />
                      ))}
                      {columnLeads.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-xs text-muted-foreground">
                            No leads
                          </p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeLeadData ? (
            <div className="w-64 bg-white rounded-xl shadow-xl ring-2 ring-brand-primary/20 p-3 opacity-95 rotate-1">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-full bg-brand-accent-light flex items-center justify-center shrink-0 text-brand-primary font-semibold text-xs">
                  {activeLeadData.contact_name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#1a1c1c] truncate">
                    {activeLeadData.contact_name}
                  </p>
                  {activeLeadData.contact_email && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {activeLeadData.contact_email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
