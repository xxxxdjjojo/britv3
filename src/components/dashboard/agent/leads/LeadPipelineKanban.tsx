"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
import { UserPlus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { LeadCard } from "./LeadCard";
import { LeadsExportButton } from "./LeadsExportButton";
import type { AgentLead, LeadStage, LeadSource } from "@/types/agent";
import { LEAD_STAGES, LEAD_SOURCES } from "@/types/agent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  initialLeads: Partial<Record<LeadStage, AgentLead[]>>;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<LeadStage, string> = {
  new_enquiry: "New Enquiry",
  qualified: "Qualified",
  viewing_booked: "Viewing Booked",
  offer_made: "Offer Made",
  closed: "Closed",
};

const STAGE_DOT: Record<LeadStage, string> = {
  new_enquiry: "bg-neutral-400",
  qualified: "bg-info",
  viewing_booked: "bg-warning",
  offer_made: "bg-success",
  closed: "bg-neutral-300",
};

const STAGE_BADGE: Record<LeadStage, string> = {
  new_enquiry: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  qualified: "bg-info/10 text-info dark:bg-info/20",
  viewing_booked: "bg-warning/10 text-warning dark:bg-warning/20",
  offer_made: "bg-success/10 text-success dark:bg-success/20",
  closed: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  subPositive,
  icon,
}: Readonly<{
  label: string;
  value: string;
  sub?: string;
  subPositive?: boolean;
  icon?: React.ReactNode;
}>) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </p>
      <div className="flex items-end gap-2 mt-0.5">
        <span className="font-heading text-2xl font-bold tracking-tight text-brand-primary-dark">
          {value}
        </span>
        {sub && (
          <span
            className={`text-xs font-semibold mb-0.5 ${subPositive ? "text-success" : "text-error"}`}
          >
            {sub}
          </span>
        )}
        {icon && <span className="ml-auto text-neutral-400">{icon}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LeadPipelineKanban({ initialLeads }: Props) {
  const [leads, setLeads] =
    useState<Partial<Record<LeadStage, AgentLead[]>>>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadName, setAddLeadName] = useState("");
  const [addLeadEmail, setAddLeadEmail] = useState("");
  const [addLeadSource, setAddLeadSource] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // Flatten all leads
  const allLeads: AgentLead[] = LEAD_STAGES.flatMap(
    (stage) => leads[stage] ?? [],
  );

  const activeLeadData = activeId
    ? allLeads.find((l) => l.id === activeId)
    : null;

  // Filter
  const filtered = allLeads.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.contact_name.toLowerCase().includes(q) ||
      (l.contact_email ?? "").toLowerCase().includes(q);
    const matchesStage = stageFilter === "all" || l.stage === stageFilter;
    const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
    return matchesSearch && matchesStage && matchesSource;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLeads = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Stats
  const totalCount = allLeads.length;
  const closedCount = (leads.closed ?? []).length;
  const conversionRate =
    totalCount > 0
      ? ((closedCount / totalCount) * 100).toFixed(1)
      : "0.0";

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const overId = over.id as string;

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
      }
    } catch {
      // fail silently — the lead can be refreshed
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        {/* ------------------------------------------------------------------ */}
        {/* Stats strip                                                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Leads"
            value={totalCount.toLocaleString("en-GB")}
          />
          <StatCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
          />
          <StatCard
            label="Offer Made"
            value={(leads.offer_made ?? []).length.toLocaleString("en-GB")}
          />
          <StatCard
            label="Active Viewings"
            value={(leads.viewing_booked ?? []).length.toLocaleString("en-GB")}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Toolbar: filters + actions                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage filter */}
          <Select
            value={stageFilter}
            onValueChange={(v) => {
              setStageFilter((v ?? "all") as LeadStage | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-40 bg-surface border-border">
              <SelectValue placeholder="Status: All Leads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All Leads</SelectItem>
              {LEAD_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source filter */}
          <Select
            value={sourceFilter}
            onValueChange={(v) => {
              setSourceFilter((v ?? "all") as LeadSource | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-32 bg-surface border-border">
              <SelectValue placeholder="Source: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Source: All</SelectItem>
              {LEAD_SOURCES.map((src) => (
                <SelectItem key={src} value={src}>
                  {src.charAt(0).toUpperCase() + src.slice(1).replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="h-8 pl-8 text-xs w-48 bg-surface border-border"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <span className="ml-auto text-xs text-muted-foreground">
            Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length) || 0}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>

          {/* Export — "Your Data, Your Leads" CSV download */}
          <LeadsExportButton />

          {/* Add Lead */}
          <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
            <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white" />}>
              <UserPlus className="size-3.5" />
              Add Lead
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
                  <Select
                    value={addLeadSource}
                    onValueChange={(v) => setAddLeadSource(v ?? "")}
                  >
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

        {/* ------------------------------------------------------------------ */}
        {/* Table                                                               */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-0 bg-surface border-b border-border px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Name
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Source
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 hidden md:block">
              Property Interest
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Status
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 hidden lg:block">
              Assigned To
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 hidden lg:block">
              Last Contact
            </span>
          </div>

          {/* Rows */}
          {pageLeads.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground bg-white dark:bg-card">
              No leads found
            </div>
          ) : (
            <ul className="divide-y divide-border bg-white dark:bg-card">
              {pageLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} stageLabel={STAGE_LABELS[lead.stage]} stageDot={STAGE_DOT[lead.stage]} stageBadge={STAGE_BADGE[lead.stage]} relativeTime={relativeTime(lead.created_at)} initials={initials(lead.contact_name)} />
              ))}
            </ul>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Pagination                                                          */}
        {/* ------------------------------------------------------------------ */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
              First Page
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`size-7 rounded text-xs font-medium transition-colors ${
                      pageNum === safePage
                        ? "bg-brand-primary text-white"
                        : "text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <span className="text-xs text-muted-foreground px-1">
                  ... {totalPages}
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Last Page
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* DragOverlay — keeps underlying DnD context live */}
      <DragOverlay>
        {activeLeadData ? (
          <div className="rounded-xl border border-border bg-white dark:bg-card shadow-lg px-4 py-3 w-72 opacity-90">
            <p className="font-medium text-sm text-brand-primary-dark">
              {activeLeadData.contact_name}
            </p>
            {activeLeadData.contact_email && (
              <p className="text-xs text-muted-foreground truncate">
                {activeLeadData.contact_email}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
