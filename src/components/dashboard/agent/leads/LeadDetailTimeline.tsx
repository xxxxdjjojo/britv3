"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  UserCheck,
  ArrowRight,
  Plus,
  Mail,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";
import type {
  AgentLead,
  AgentLeadActivity,
  AgentTeamMember,
  LeadStage,
} from "@/types/agent";
import { LEAD_STAGES } from "@/types/agent";

type Props = Readonly<{
  lead: AgentLead;
  activities: AgentLeadActivity[];
  teamMembers: AgentTeamMember[];
  userId: string;
}>;

const STAGE_LABELS: Record<LeadStage, string> = {
  new_enquiry: "New Enquiry",
  qualified: "Qualified",
  viewing_booked: "Viewing Booked",
  offer_made: "Offer Made",
  closed: "Closed",
};

function ActivityIcon({ type }: Readonly<{ type: string }>) {
  switch (type) {
    case "note":
    case "note_added":
      return (
        <div className="flex items-center justify-center size-9 rounded-full bg-blue-100 text-blue-600 shrink-0 ring-4 ring-white">
          <MessageSquare className="size-4" />
        </div>
      );
    case "lead_assigned":
      return (
        <div className="flex items-center justify-center size-9 rounded-full bg-success/10 text-success shrink-0 ring-4 ring-white">
          <UserCheck className="size-4" />
        </div>
      );
    case "stage_changed":
      return (
        <div className="flex items-center justify-center size-9 rounded-full bg-warning/10 text-warning shrink-0 ring-4 ring-white">
          <ArrowRight className="size-4" />
        </div>
      );
    case "lead_created":
    default:
      return (
        <div className="flex items-center justify-center size-9 rounded-full bg-muted text-muted-foreground shrink-0 ring-4 ring-white">
          <Plus className="size-4" />
        </div>
      );
  }
}

export function LeadDetailTimeline({
  lead,
  activities,
  teamMembers,
  userId,
}: Props) {
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [localActivities, setLocalActivities] =
    useState<AgentLeadActivity[]>(activities);
  const [currentStage, setCurrentStage] = useState<LeadStage>(lead.stage);
  const [currentAssignedTo, setCurrentAssignedTo] = useState<string>(
    lead.assigned_to ?? "",
  );

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch("/api/agent/leads/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          activity_type: "note_added",
          description: noteText,
        }),
      });
      if (res.ok) {
        const newActivity = (await res.json()) as AgentLeadActivity;
        setLocalActivities((prev) => [...prev, newActivity]);
        setNoteText("");
      }
    } catch {
      // fail silently
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleStageChange(newStage: string | null) {
    if (!newStage) return;
    setCurrentStage(newStage as LeadStage);
    try {
      await fetch("/api/agent/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, stage: newStage }),
      });
    } catch {
      setCurrentStage(lead.stage);
    }
  }

  async function handleAssignedToChange(assigneeId: string | null) {
    const value = assigneeId ?? "";
    setCurrentAssignedTo(value);
    try {
      await fetch("/api/agent/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, assigned_to: value }),
      });
    } catch {
      setCurrentAssignedTo(lead.assigned_to ?? "");
    }
  }

  const assignedMember = teamMembers.find(
    (m) => m.user_id === currentAssignedTo,
  );

  return (
    <div className="grid lg:grid-cols-[268px_1fr_220px] gap-5">
      {/* ── Left sidebar: Contact info + Pipeline ── */}
      <div className="space-y-4">
        {/* Contact Information */}
        <Card className="bg-surface border-border rounded-xl">
          <CardHeader className="pb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Contact Information
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {lead.contact_email && (
              <div className="flex items-start gap-2.5">
                <Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground mb-0.5">
                    Email Address
                  </p>
                  <a
                    href={`mailto:${lead.contact_email}`}
                    className="text-sm text-brand-primary hover:underline break-all"
                  >
                    {lead.contact_email}
                  </a>
                </div>
              </div>
            )}

            {lead.contact_phone && (
              <div className="flex items-start gap-2.5">
                <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground mb-0.5">
                    Phone Number
                  </p>
                  <a
                    href={`tel:${lead.contact_phone}`}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    {lead.contact_phone}
                  </a>
                </div>
              </div>
            )}

            {lead.source && (
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground mb-0.5">
                    Source
                  </p>
                  <p className="text-sm">
                    {lead.source.charAt(0).toUpperCase() +
                      lead.source.slice(1).replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card className="bg-surface border-border rounded-xl">
          <CardHeader className="pb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Pipeline
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Stage</p>
              <Select
                value={currentStage}
                onValueChange={(v) => handleStageChange(v as LeadStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Assigned to</p>
              <Select
                value={currentAssignedTo}
                onValueChange={handleAssignedToChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.user_id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assignedMember && (
              <div className="pt-1 border-t border-border">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-2">
                  Team Assignment
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-semibold shrink-0">
                    {assignedMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{assignedMember.name}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Center: Activity Timeline ── */}
      <div>
        <Card className="bg-surface border-border rounded-xl h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-semibold">
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-5">
            {localActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet.
              </p>
            ) : (
              <ol className="relative space-y-0">
                {localActivities.map((activity, idx) => (
                  <li
                    key={activity.id}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {/* Vertical connector line */}
                    {idx < localActivities.length - 1 && (
                      <div className="absolute left-[17px] top-9 bottom-0 w-px bg-border" />
                    )}
                    <ActivityIcon type={activity.activity_type} />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">
                          {activity.description ?? activity.activity_type}
                        </p>
                        <time className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                          {new Date(activity.created_at).toLocaleString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.actor_id === userId
                          ? "You"
                          : activity.actor_id.slice(0, 8) + "…"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Note input */}
            <form onSubmit={handleAddNote} className="mt-6 space-y-2.5">
              <Textarea
                placeholder="Type an internal note or update activity..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                  disabled={isAddingNote || !noteText.trim()}
                >
                  <MessageSquare className="mr-2 size-3.5" />
                  {isAddingNote ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Right sidebar: Stage summary + Actions ── */}
      <div className="space-y-4">
        {/* Lead status summary */}
        <Card className="bg-surface border-border rounded-xl">
          <CardHeader className="pb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Lead Status
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-xs">
                {STAGE_LABELS[currentStage]}
              </Badge>
              {lead.source && (
                <Badge variant="outline" className="text-xs">
                  {lead.source.charAt(0).toUpperCase() +
                    lead.source.slice(1).replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Created</p>
              <p className="text-sm font-medium mt-0.5">
                {new Date(lead.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {localActivities.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Last activity
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(
                    localActivities[localActivities.length - 1].created_at,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-surface border-border rounded-xl">
          <CardHeader className="pb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Actions
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {lead.contact_email && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-border"
                asChild
              >
                <a href={`mailto:${lead.contact_email}`}>
                  <Mail className="mr-2 size-4" />
                  Send Email
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-border"
              asChild
            >
              <Link href="/dashboard/agent/viewings">
                <Calendar className="mr-2 size-4" />
                Book Viewing
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
