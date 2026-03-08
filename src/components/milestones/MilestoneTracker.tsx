"use client";

/**
 * MilestoneTracker -- generic vertical stepper with connected line between steps.
 * Renders milestone progress with optional inline editing for status/notes.
 */

import { useState } from "react";
import { CheckCircle, Circle, CircleDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MilestoneStatus } from "@/types/milestones";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MilestoneStep = Readonly<{
  id: string;
  key: string;
  label: string;
  description: string;
  status: MilestoneStatus;
  notes: string | null;
  completedDate: string | null;
}>;

type MilestoneTrackerProps = Readonly<{
  title: string;
  milestones: MilestoneStep[];
  onUpdate?: (milestoneId: string, data: { status: MilestoneStatus; notes?: string }) => void;
  readOnly?: boolean;
}>;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    lineColor: "bg-green-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "Completed",
  },
  in_progress: {
    icon: CircleDot,
    color: "text-amber-600 dark:text-amber-400",
    lineColor: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    label: "In Progress",
  },
  not_started: {
    icon: Circle,
    color: "text-gray-400 dark:text-gray-500",
    lineColor: "bg-gray-200 dark:bg-gray-700",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    label: "Not Started",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MilestoneTracker({
  title,
  milestones,
  onUpdate,
  readOnly = false,
}: MilestoneTrackerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<MilestoneStatus>("not_started");
  const [editNotes, setEditNotes] = useState("");

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  function handleExpand(milestone: MilestoneStep) {
    if (readOnly || !onUpdate) return;
    if (expandedId === milestone.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(milestone.id);
    setEditStatus(milestone.status);
    setEditNotes(milestone.notes ?? "");
  }

  function handleSave(milestoneId: string) {
    if (!onUpdate) return;
    onUpdate(milestoneId, { status: editStatus, notes: editNotes || undefined });
    setExpandedId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={percentage} className="flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {completedCount}/{total} completed
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {milestones.map((milestone, index) => {
            const config = STATUS_CONFIG[milestone.status];
            const Icon = config.icon;
            const isLast = index === milestones.length - 1;
            const isExpanded = expandedId === milestone.id;

            return (
              <div key={milestone.id} className="relative flex gap-4">
                {/* Vertical line + icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`z-10 ${!readOnly && onUpdate ? "cursor-pointer" : ""}`}
                    onClick={() => handleExpand(milestone)}
                  >
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-8 ${config.lineColor}`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{milestone.label}</p>
                      <Tooltip>
                        <TooltipTrigger
                          render={<p className="text-xs text-muted-foreground line-clamp-1" />}
                        >
                          {milestone.description}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{milestone.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${config.badge}`}>
                      {config.label}
                    </Badge>
                  </div>

                  {milestone.status === "completed" && milestone.completedDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed: {milestone.completedDate}
                    </p>
                  )}

                  {milestone.notes && !isExpanded && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {milestone.notes}
                    </p>
                  )}

                  {/* Inline edit panel */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 p-3 rounded-md border bg-muted/50">
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          Status
                        </label>
                        <Select
                          value={editStatus}
                          onValueChange={(v) => setEditStatus(v as MilestoneStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          Notes
                        </label>
                        <Textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add notes..."
                          className="text-xs min-h-16"
                          maxLength={500}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(milestone.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
