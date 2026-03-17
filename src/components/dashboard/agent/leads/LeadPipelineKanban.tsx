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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search } from "lucide-react";
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
      className={`min-h-[200px] bg-muted/50 rounded-lg p-3 transition-colors ${isOver ? "bg-muted" : ""}`}
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
      // over.id is another lead — find which stage it belongs to
      for (const stage of LEAD_STAGES) {
        if ((leads[stage] ?? []).some((l) => l.id === overId)) {
          newStage = stage;
          break;
        }
      }
    }

    if (!newStage) return;

    // Find the lead's current stage
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
      // Revert on error
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
      }
    } catch {
      // fail silently — the lead can be refreshed
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 size-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="lead-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lead-name"
                  placeholder="Contact name"
                  value={addLeadName}
                  onChange={(e) => setAddLeadName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={addLeadEmail}
                  onChange={(e) => setAddLeadEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lead-source">Source</Label>
                <Select value={addLeadSource} onValueChange={setAddLeadSource}>
                  <SelectTrigger id="lead-source">
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
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddLeadOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => {
            const columnLeads = filterLeads(leads[stage] ?? []);
            const totalCount = (leads[stage] ?? []).length;
            return (
              <div key={stage} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-semibold">
                    {STAGE_LABELS[stage]}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {totalCount}
                  </Badge>
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
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No leads
                        </p>
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
            <Card className="w-64 shadow-lg opacity-90">
              <CardContent className="p-3">
                <p className="font-medium text-sm">
                  {activeLeadData.contact_name}
                </p>
                {activeLeadData.contact_email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activeLeadData.contact_email}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
