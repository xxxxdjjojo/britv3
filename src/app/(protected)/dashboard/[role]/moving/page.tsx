"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, PackageOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const PHASES: PhaseConfig[] = [
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

function getPhaseForItem(item: ChecklistItem): ChecklistPhase {
  const stage = item.offer_stage ?? "pre_offer";
  for (const phase of PHASES) {
    if (phase.stages.includes(stage)) {
      return phase.id;
    }
  }
  return "pre_offer";
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

async function createChecklist(offerId?: string): Promise<ChecklistItem[]> {
  const res = await fetch("/api/moving-checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offer_id: offerId }),
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
  isPending,
}: {
  item: ChecklistItem;
  onToggle: (id: string, completed: boolean) => void;
  isPending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id, !item.is_completed)}
      disabled={isPending}
      className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
    >
      {item.is_completed ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
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
  pendingId,
}: {
  phase: PhaseConfig;
  items: ChecklistItem[];
  onToggle: (id: string, completed: boolean) => void;
  pendingId: string | null;
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
            allDone ? "text-success dark:text-success" : "text-muted-foreground",
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
                isPending={pendingId === item.id}
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

export default function MovingChecklistPage() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

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
    mutationFn: () => createChecklist(),
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
    onMutate: ({ id }) => setPendingId(id),
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
    onSettled: () => setPendingId(null),
  });

  function handleToggle(id: string, completed: boolean) {
    toggleMutation.mutate({ id, completed });
  }

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moving Checklist</h1>
          <p className="text-muted-foreground">Track every step of your buying journey</p>
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
          <p className="text-muted-foreground">Track every step of your buying journey</p>
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
          <p className="text-muted-foreground">Track every step of your buying journey</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
            <PackageOpen className="size-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="font-semibold">Start your moving journey</p>
              <p className="text-sm text-muted-foreground">
                Generate your personalised step-by-step checklist for buying a home in the UK.
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
  for (const phase of PHASES) {
    grouped.set(phase.id, []);
  }
  for (const item of itemList) {
    const phaseId = getPhaseForItem(item);
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
            <span className="text-sm font-semibold text-success dark:text-success">
              {progressPct}%
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Phase groups */}
      {PHASES.map((phase) => {
        const phaseItems = grouped.get(phase.id) ?? [];
        if (phaseItems.length === 0) return null;
        return (
          <PhaseGroup
            key={phase.id}
            phase={phase}
            items={phaseItems}
            onToggle={handleToggle}
            pendingId={pendingId}
          />
        );
      })}
    </div>
  );
}
