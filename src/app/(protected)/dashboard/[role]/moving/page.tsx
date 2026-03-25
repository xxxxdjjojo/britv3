"use client";

import { use, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, PackageOpen, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { ChecklistItem, ChecklistPhase } from "@/services/moving/moving-checklist-service";

// ---------------------------------------------------------------------------
// Phase configuration
// ---------------------------------------------------------------------------

type PhaseConfig = {
  id: ChecklistPhase;
  label: string;
  stages: string[];
};

const BUYER_PHASES: PhaseConfig[] = [
  {
    id: "pre_offer",
    label: "Pre-Offer",
    stages: ["pre_offer"],
  },
  {
    id: "under_offer",
    label: "Under Offer",
    stages: [
      "submitted",
      "solicitors_instructed",
      "searches",
      "survey",
      "mortgage_approved",
    ],
  },
  {
    id: "exchange",
    label: "Exchange",
    stages: ["exchange"],
  },
  {
    id: "completion",
    label: "Completion",
    stages: ["completion"],
  },
  {
    id: "post_move",
    label: "After Moving In",
    stages: ["post_move"],
  },
];

const RENTER_PHASES: PhaseConfig[] = [
  {
    id: "pre_application",
    label: "Pre-Application",
    stages: ["pre_application"],
  },
  {
    id: "application_submitted",
    label: "Application Submitted",
    stages: ["application_submitted"],
  },
  {
    id: "references",
    label: "References & Checks",
    stages: ["references"],
  },
  {
    id: "tenancy_agreement",
    label: "Tenancy Agreement",
    stages: ["tenancy_agreement"],
  },
  {
    id: "move_in",
    label: "Move-In Day",
    stages: ["move_in"],
  },
  {
    id: "post_move",
    label: "After Moving In",
    stages: ["post_move"],
  },
];

function getPhaseForItem(item: ChecklistItem, phases: PhaseConfig[]): ChecklistPhase {
  const stage = item.offer_stage ?? phases[0]?.id ?? "pre_offer";
  for (const phase of phases) {
    if (phase.stages.includes(stage)) {
      return phase.id;
    }
  }
  return phases[0]?.id ?? "pre_offer";
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchItems(offerId?: string): Promise<ChecklistItem[]> {
  const url = offerId
    ? `/api/moving-checklist?offer_id=${encodeURIComponent(offerId)}`
    : "/api/moving-checklist";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch checklist");
  return res.json() as Promise<ChecklistItem[]>;
}

async function createChecklist(offerId?: string, role?: string): Promise<ChecklistItem[]> {
  const res = await fetch("/api/moving-checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offer_id: offerId, role }),
  });
  if (!res.ok) throw new Error("Failed to create checklist");
  return res.json() as Promise<ChecklistItem[]>;
}

async function toggleItem(id: string, isCompleted: boolean): Promise<ChecklistItem> {
  const res = await fetch(`/api/moving-checklist/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_completed: isCompleted }),
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json() as Promise<ChecklistItem>;
}

async function addCustomItem(title: string, description?: string): Promise<ChecklistItem> {
  const res = await fetch("/api/moving-checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description: description || null, is_custom: true }),
  });
  if (!res.ok) throw new Error("Failed to add custom item");
  return res.json() as Promise<ChecklistItem>;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-start gap-3">
                <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single checklist item row
// ---------------------------------------------------------------------------

function ChecklistRow({
  item,
  onToggle,
  pendingIds,
}: {
  item: ChecklistItem;
  onToggle: (id: string, completed: boolean) => void;
  pendingIds: Set<string>;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id, !item.is_completed)}
      disabled={pendingIds.has(item.id)}
      className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
    >
      {item.is_completed ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
      ) : (
        <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={[
            "text-sm font-medium leading-snug",
            item.is_completed ? "text-muted-foreground line-through" : "text-foreground",
          ].join(" ")}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
            {item.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Collapsible phase group
// ---------------------------------------------------------------------------

function PhaseGroup({
  phase,
  items,
  onToggle,
  pendingIds,
}: {
  phase: PhaseConfig;
  items: ChecklistItem[];
  onToggle: (id: string, completed: boolean) => void;
  pendingIds: Set<string>;
}) {
  const [open, setOpen] = useState(true);
  const completedCount = items.filter((i) => i.is_completed).length;
  const allDone = completedCount === items.length;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-sm">{phase.label}</span>
        </div>
        <span
          className={[
            "text-xs font-medium tabular-nums",
            allDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
          ].join(" ")}
        >
          {completedCount}/{items.length} complete
        </span>
      </button>

      {open && (
        <CardContent className="pt-0 pb-3">
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={onToggle}
                pendingIds={pendingIds}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MovingChecklistPage(
  props: Readonly<{ params: Promise<{ role: string }> }>,
) {
  const { role } = use(props.params);
  const phases = role === "renter" ? RENTER_PHASES : BUYER_PHASES;
  const journeyText =
    role === "renter"
      ? "Track every step of your tenancy journey"
      : "Track every step of your buying journey";

  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const {
    data: items,
    isLoading,
    isError,
    refetch,
  } = useQuery<ChecklistItem[]>({
    queryKey: ["moving-checklist"],
    queryFn: () => fetchItems(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => createChecklist(undefined, role),
    onSuccess: (newItems) => {
      queryClient.setQueryData(["moving-checklist"], newItems);
      toast.success("Moving checklist created");
    },
    onError: () => {
      toast.error("Failed to create checklist. Please try again.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleItem(id, completed),
    onMutate: ({ id }) => setPendingIds((prev) => new Set(prev).add(id)),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["moving-checklist"],
        (old: ChecklistItem[] | undefined) =>
          (old ?? []).map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        updated.is_completed ? "Item marked complete" : "Item unmarked",
      );
    },
    onError: () => {
      toast.error("Failed to update item. Please try again.");
    },
    onSettled: (_data, _err, { id }) => setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }),
  });

  const customTitleRef = useRef<HTMLInputElement>(null);
  const customDescRef = useRef<HTMLInputElement>(null);

  const addCustomMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) =>
      addCustomItem(title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moving-checklist"] });
      toast.success("Item added");
      if (customTitleRef.current) customTitleRef.current.value = "";
      if (customDescRef.current) customDescRef.current.value = "";
    },
    onError: () => {
      toast.error("Failed to add item. Please try again.");
    },
  });

  function handleToggle(id: string, completed: boolean) {
    toggleMutation.mutate({ id, completed });
  }

  function handleAddCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = customTitleRef.current?.value.trim();
    if (!title) return;
    const description = customDescRef.current?.value.trim() || undefined;
    addCustomMutation.mutate({ title, description });
  }

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moving Checklist</h1>
          <p className="text-muted-foreground">{journeyText}</p>
        </div>
        <ChecklistSkeleton />
      </div>
    );
  }

  // ---- Error ----
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moving Checklist</h1>
          <p className="text-muted-foreground">{journeyText}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load your checklist. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const itemList = items ?? [];

  // ---- Empty state ----
  if (itemList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moving Checklist</h1>
          <p className="text-muted-foreground">{journeyText}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
            <PackageOpen className="size-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="font-semibold">Start your moving journey</p>
              <p className="text-sm text-muted-foreground">
                {role === "renter"
                  ? "Generate your personalised step-by-step checklist for renting a home in the UK."
                  : "Generate your personalised step-by-step checklist for buying a home in the UK."}
              </p>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Checklist"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Populated state ----
  const completedCount = itemList.filter((i) => i.is_completed).length;
  const totalCount = itemList.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group items by phase
  const grouped = new Map<ChecklistPhase, ChecklistItem[]>();
  for (const phase of phases) {
    grouped.set(phase.id, []);
  }
  for (const item of itemList) {
    const phaseId = getPhaseForItem(item, phases);
    const arr = grouped.get(phaseId);
    if (arr) arr.push(item);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moving Checklist</h1>
        <p className="text-muted-foreground">Track every step of your buying journey</p>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount} of {totalCount} items complete
            </span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {progressPct}%
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Phase groups */}
      {phases.map((phase) => {
        const phaseItems = grouped.get(phase.id) ?? [];
        if (phaseItems.length === 0) return null;
        return (
          <PhaseGroup
            key={phase.id}
            phase={phase}
            items={phaseItems}
            onToggle={handleToggle}
            pendingIds={pendingIds}
          />
        );
      })}

      {/* Add custom item */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <form onSubmit={handleAddCustom} className="space-y-3">
            <p className="text-sm font-medium">Add custom item</p>
            <Input
              ref={customTitleRef}
              placeholder="Item title"
              required
              maxLength={200}
            />
            <Input
              ref={customDescRef}
              placeholder="Description (optional)"
              maxLength={500}
            />
            <Button
              type="submit"
              size="sm"
              disabled={addCustomMutation.isPending}
            >
              <PlusCircle className="mr-1 size-4" />
              {addCustomMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
